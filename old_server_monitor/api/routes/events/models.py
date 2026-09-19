import json

from datetime import datetime, date, time
from pydantic import BaseModel


class EventsQueryParams(BaseModel):
    id: str | None = None
    server: str | None = None


class QuickLinkDataObject(BaseModel):
    display: str
    url: str


class EventDataObject(BaseModel):
    id: str
    server: str
    title: str
    description: str
    event_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    meetup_location: str | None = None
    expanded_details: str | None = None
    image_url: str | None = None
    quick_links: list[QuickLinkDataObject] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None
    changelog: list[str] = []

    @property
    def to_json(self):
        response = json.loads(self.model_dump_json())
        return response

    @classmethod
    def from_json(cls, data_object):
        obj = cls(**data_object)
        return obj
