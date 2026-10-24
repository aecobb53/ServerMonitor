from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Any
from common.models import VersionModel

# Requests

class RegisterRequest(BaseModel):
    reporter_uid: str
    version: VersionModel | str
    callback_url: str | None = None


class ReporterFilePayload(BaseModel):
    reporter_uid: str
    path: str
    modified_time: float
    content: str


class ReporterServerContent(BaseModel):
    server_name: str
    game: str
    display_name: str
    description: str
    news: list[str]
    rules: list[str]
    expected: bool = True


class ParserModel(BaseModel):
    name: str
    version: VersionModel | str


class ContainerModel(BaseModel):
    id: str | None
    name: str | None
    status: str
    started_at: datetime | None


class HealthModel(BaseModel):
    status: str
    message: str
    updated_at: datetime
    confidence: str


class LatestStatusModel(BaseModel):
    status: str
    message: str
    line: str
    timestamp: datetime
    source: str
    parser_name: str | None = None
    parser_version: VersionModel | str


class HistoryEntryModel(BaseModel):
    status: str
    message: str
    line: str | None
    timestamp: datetime
    source: str
    parser_name: str | None = None
    parser_version: VersionModel | str | None = None


class ErrorEntryModel(BaseModel):
    type: str
    message: str
    line: str | None = None
    timestamp: datetime
    source: str
    parser_name: str | None = None
    parser_version: VersionModel | str | None = None


class CollectorModel(BaseModel):
    collector_version: VersionModel | str
    updated_at: datetime
    last_reconciled_at: datetime | None
    last_log_at: datetime | None
    history_dropped: int
    errors_dropped: int


class ServerUpdatePOST(BaseModel):
    schema_version: float | int
    server_name: str
    game_name: str
    record_datetime: datetime

    parser: ParserModel
    container: ContainerModel
    health: HealthModel
    latest_status: LatestStatusModel
    history: list[HistoryEntryModel]
    errors: list[ErrorEntryModel]
    collector: CollectorModel


class ServerUpdatePUT(BaseModel):
    schema_version: float | int
    server_name: str
    game_name: str
    record_datetime: datetime

    parser: ParserModel | None = None
    container: ContainerModel | None = None
    health: HealthModel | None = None
    latest_status: LatestStatusModel | None = None
    history: list[HistoryEntryModel] | None = None
    errors: list[ErrorEntryModel] | None = None
    collector: CollectorModel | None = None

# Responses
