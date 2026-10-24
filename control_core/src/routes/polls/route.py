import json
import re
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from common.models import ResponseObject
from common.utils import POLLS_DIR, POLL_RESPONSES_DIR

from .logic import build_poll_read_object, find_polls, find_poll_responses, sync_poll_response_count
from .models import PollDataObject, PollResponseDataObject, PollResponseQueryParams, PollsQueryParams, PollStatus


router = APIRouter(
    prefix='/api',
    tags=['polls'],
)


def _ensure_storage_dirs() -> None:
    POLLS_DIR.mkdir(parents=True, exist_ok=True)
    POLL_RESPONSES_DIR.mkdir(parents=True, exist_ok=True)


def _next_id(prefix: str, pattern_glob: str, directory) -> str:
    id_number = 0
    for existing_file in directory.glob(pattern_glob):
        match = re.match(rf".*{prefix}-(\d+)\.json", str(existing_file))
        if match:
            id_number = max(id_number, int(match.group(1)))
    id_number += 1
    return f"{prefix}-{id_number:03d}"


def _write_poll(poll: PollDataObject) -> None:
    with open(POLLS_DIR / f"{poll.id}.json", 'w') as jf:
        jf.write(json.dumps(poll.to_json, indent=4))


@router.get('/polls', status_code=200)
def polls(query: Annotated[PollsQueryParams, Depends()]) -> ResponseObject:
    _ensure_storage_dirs()

    polls_list = find_polls(query=query)
    response = []
    for poll in polls_list:
        poll = sync_poll_response_count(poll)
        poll_responses = find_poll_responses(PollResponseQueryParams(poll_id=poll.id))
        response.append(build_poll_read_object(poll, poll_responses))

    return {
        "success": True,
        "data": response,
    }


@router.post('/polls', status_code=201)
def create_poll(creation_object: PollDataObject) -> ResponseObject:
    _ensure_storage_dirs()

    poll_id = _next_id(prefix='poll', pattern_glob='poll-*.json', directory=POLLS_DIR)
    creation_object.id = poll_id
    creation_object.created_at = datetime.now(timezone.utc)
    creation_object.updated_at = datetime.now(timezone.utc)
    creation_object.response_count = 0

    _write_poll(creation_object)

    return {
        "success": True,
        "data": creation_object,
    }


@router.put('/polls/{poll_id}', status_code=200)
def update_poll(poll_id: str, update_object: PollDataObject) -> ResponseObject:
    _ensure_storage_dirs()

    poll_file = POLLS_DIR / f"{poll_id}.json"
    if not poll_file.exists():
        raise HTTPException(status_code=404, detail=f"Poll {poll_id} was not found")

    with open(poll_file, 'r') as pf:
        current_poll = PollDataObject.from_json(json.load(pf))

    current_time = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

    if current_poll.title != update_object.title:
        current_poll.changelog.append(f"{current_time} Changed title from {current_poll.title} to {update_object.title}")
        current_poll.title = update_object.title
    if current_poll.description != update_object.description:
        current_poll.changelog.append(f"{current_time} Changed description from {current_poll.description} to {update_object.description}")
        current_poll.description = update_object.description
    if current_poll.poll_type != update_object.poll_type:
        current_poll.changelog.append(f"{current_time} Changed poll_type from {current_poll.poll_type} to {update_object.poll_type}")
        current_poll.poll_type = update_object.poll_type
    if current_poll.status != update_object.status:
        current_poll.changelog.append(f"{current_time} Changed status from {current_poll.status} to {update_object.status}")
        current_poll.status = update_object.status
    if current_poll.anonymous_responses != update_object.anonymous_responses:
        current_poll.changelog.append(f"{current_time} Changed anonymous_responses from {current_poll.anonymous_responses} to {update_object.anonymous_responses}")
        current_poll.anonymous_responses = update_object.anonymous_responses
    if current_poll.allow_vote_changes != update_object.allow_vote_changes:
        current_poll.changelog.append(f"{current_time} Changed allow_vote_changes from {current_poll.allow_vote_changes} to {update_object.allow_vote_changes}")
        current_poll.allow_vote_changes = update_object.allow_vote_changes
    if current_poll.options != update_object.options:
        current_poll.changelog.append(f"{current_time} Changed options")
        current_poll.options = update_object.options
    if current_poll.questions != update_object.questions:
        current_poll.changelog.append(f"{current_time} Changed questions")
        current_poll.questions = update_object.questions

    current_poll.created_by = update_object.created_by if update_object.created_by is not None else current_poll.created_by
    current_poll.updated_at = datetime.now(timezone.utc)
    current_poll = sync_poll_response_count(current_poll)

    _write_poll(current_poll)

    return {
        "success": True,
        "data": current_poll,
    }


@router.post('/polls/responses', status_code=201)
def create_poll_response(creation_object: PollResponseDataObject) -> ResponseObject:
    _ensure_storage_dirs()

    poll_matches = find_polls(PollsQueryParams(id=creation_object.poll_id))
    if not poll_matches:
        raise HTTPException(status_code=404, detail=f"Poll {creation_object.poll_id} was not found")

    poll = poll_matches[0]
    if poll.status == PollStatus.CLOSED:
        raise HTTPException(status_code=409, detail=f"Poll {creation_object.poll_id} is closed")

    existing_response = None
    if creation_object.user_id:
        existing = find_poll_responses(PollResponseQueryParams(poll_id=creation_object.poll_id, user_id=creation_object.user_id))
        if existing:
            existing_response = existing[0]

    if existing_response and not poll.allow_vote_changes:
        raise HTTPException(status_code=409, detail='Vote changes are disabled for this poll')

    if existing_response:
        creation_object.id = existing_response.id
        creation_object.created_at = existing_response.created_at
        creation_object.updated_at = datetime.now(timezone.utc)
    else:
        response_id = _next_id(prefix='resp', pattern_glob='resp-*.json', directory=POLL_RESPONSES_DIR)
        creation_object.id = response_id
        creation_object.created_at = datetime.now(timezone.utc)
        creation_object.updated_at = datetime.now(timezone.utc)

    with open(POLL_RESPONSES_DIR / f"{creation_object.id}.json", 'w') as jf:
        jf.write(json.dumps(creation_object.to_json, indent=4))

    poll = sync_poll_response_count(poll)
    poll.updated_at = datetime.now(timezone.utc)
    _write_poll(poll)

    return {
        "success": True,
        "data": creation_object,
    }


@router.get('/polls/responses', status_code=200)
def poll_responses(query: Annotated[PollResponseQueryParams, Depends()]) -> ResponseObject:
    _ensure_storage_dirs()

    response = find_poll_responses(query=query)

    return {
        "success": True,
        "data": response,
    }
