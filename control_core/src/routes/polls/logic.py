import json
from datetime import datetime

from common.utils import POLLS_DIR, POLL_RESPONSES_DIR
from .models import (
    PollAvailabilitySummary,
    PollDataObject,
    PollOptionSummary,
    PollRatingSummary,
    PollReadDataObject,
    PollResponseDataObject,
    PollResponseQueryParams,
    PollSummaryDataObject,
    PollTextResponseSummary,
    PollsQueryParams,
)


def find_polls(query: PollsQueryParams = PollsQueryParams()):
    polls = []
    for poll_file in POLLS_DIR.glob("*.json"):
        with open(poll_file) as pf:
            poll_info = json.load(pf)
            poll = PollDataObject(**poll_info)

            if query.id is not None and poll.id != query.id:
                continue
            if query.poll_type is not None and str(poll.poll_type) != query.poll_type and poll.poll_type.value != query.poll_type:
                continue
            if query.status is not None and str(poll.status) != query.status and poll.status.value != query.status:
                continue

            polls.append(poll)
    return polls


def find_poll_responses(query: PollResponseQueryParams = PollResponseQueryParams()):
    responses = []
    for response_file in POLL_RESPONSES_DIR.glob("*.json"):
        with open(response_file) as rf:
            response_info = json.load(rf)
            response = PollResponseDataObject(**response_info)

            if query.id is not None and response.id != query.id:
                continue
            if query.poll_id is not None and response.poll_id != query.poll_id:
                continue
            if query.user_id is not None and response.user_id != query.user_id:
                continue

            responses.append(response)
    return responses


def sync_poll_response_count(poll: PollDataObject):
    response_count = len(find_poll_responses(PollResponseQueryParams(poll_id=poll.id)))
    poll.response_count = response_count
    return poll


def build_poll_read_object(poll: PollDataObject, responses: list[PollResponseDataObject]) -> PollReadDataObject:
    option_summary: dict[str, PollOptionSummary] = {
        option.id: PollOptionSummary(option_id=option.id, label=option.label)
        for option in poll.options
    }

    rating_values: list[int] = []
    availability = PollAvailabilitySummary()
    text_responses: list[tuple[datetime, PollTextResponseSummary]] = []

    for response in responses:
        for choice_id in response.choice_ids:
            if choice_id in option_summary:
                option_summary[choice_id].votes += 1

        for rank_index, ranked_option_id in enumerate(response.rankings):
            if ranked_option_id in option_summary:
                weight = max(len(response.rankings) - rank_index, 1)
                option_summary[ranked_option_id].weighted_score += weight

        if isinstance(response.rating, int):
            rating_values.append(response.rating)

        for window in response.availability_windows:
            availability.windows += 1
            kind = str(window.get("kind", "")).lower()
            if "definite" in kind:
                availability.definitely += 1
            else:
                availability.maybe += 1

        if response.text is not None and response.text.strip():
            timestamp = response.updated_at or response.created_at or datetime.min
            text_responses.append((
                timestamp,
                PollTextResponseSummary(
                    response_id=response.id or "",
                    user=(response.user_id or "Anonymous").strip() or "Anonymous",
                    text=response.text.strip(),
                ),
            ))

    rating = PollRatingSummary()
    if rating_values:
        rating.count = len(rating_values)
        rating.average = round(sum(rating_values) / len(rating_values), 2)

    text_responses.sort(key=lambda item: item[0], reverse=True)
    recent_text = [item[1] for item in text_responses[:3]]

    summary = PollSummaryDataObject(
        total_responses=len(responses),
        options=list(option_summary.values()),
        rating=rating,
        availability=availability,
        recent_text_responses=recent_text,
    )

    return PollReadDataObject(**poll.model_dump(), summary=summary)
