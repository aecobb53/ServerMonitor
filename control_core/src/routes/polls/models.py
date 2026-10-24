import json

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class PollsQueryParams(BaseModel):
    id: str | None = None
    poll_type: str | None = None
    status: str | None = None


class PollType(str, Enum):
    SINGLE_CHOICE = 'single_choice'
    MULTI_CHOICE = 'multi_choice'
    RANKED_CHOICE = 'ranked_choice'
    AVAILABILITY = 'availability'
    RATING = 'rating'
    SHORT_RESPONSE = 'short_response'
    QA = 'qa'


class PollStatus(str, Enum):
    OPEN = 'open'
    CLOSED = 'closed'


class OptionDataObject(BaseModel):
    id: str
    label: str


class QuestionDataObject(BaseModel):
    id: str
    label: str


class PollDataObject(BaseModel):
    id: str | None = None
    title: str
    description: str = ''
    poll_type: PollType
    status: PollStatus = PollStatus.OPEN
    anonymous_responses: bool = False
    allow_vote_changes: bool = True
    options: list[OptionDataObject] = Field(default_factory=list)
    questions: list[QuestionDataObject] = Field(default_factory=list)
    created_by: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    changelog: list[str] = Field(default_factory=list)
    response_count: int = 0

    @property
    def to_json(self):
        response = json.loads(self.model_dump_json())
        return response

    @classmethod
    def from_json(cls, data_object):
        obj = cls(**data_object)
        return obj


class PollOptionSummary(BaseModel):
    option_id: str
    label: str
    votes: int = 0
    weighted_score: int = 0


class PollRatingSummary(BaseModel):
    average: float | None = None
    count: int = 0


class PollAvailabilitySummary(BaseModel):
    windows: int = 0
    definitely: int = 0
    maybe: int = 0


class PollTextResponseSummary(BaseModel):
    response_id: str
    user: str
    text: str


class PollSummaryDataObject(BaseModel):
    total_responses: int = 0
    options: list[PollOptionSummary] = Field(default_factory=list)
    rating: PollRatingSummary = Field(default_factory=PollRatingSummary)
    availability: PollAvailabilitySummary = Field(default_factory=PollAvailabilitySummary)
    recent_text_responses: list[PollTextResponseSummary] = Field(default_factory=list)


class PollReadDataObject(PollDataObject):
    summary: PollSummaryDataObject = Field(default_factory=PollSummaryDataObject)


class PollResponseQueryParams(BaseModel):
    id: str | None = None
    poll_id: str | None = None
    user_id: str | None = None


class PollResponseDataObject(BaseModel):
    id: str | None = None
    poll_id: str
    user_id: str | None = None
    # user_id: str | None = None
    choice_ids: list[str] = Field(default_factory=list)
    rankings: list[str] = Field(default_factory=list)
    rating: int | None = None
    text: str | None = None
    availability_windows: list[dict] = Field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @property
    def to_json(self):
        response = json.loads(self.model_dump_json())
        return response

    @classmethod
    def from_json(cls, data_object):
        obj = cls(**data_object)
        return obj