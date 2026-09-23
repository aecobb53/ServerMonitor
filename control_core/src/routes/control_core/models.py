from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Any
from common.models import VersionModel

# Requests

"""
        payload = {
            "reporter_uid": self.uid,
            "version": self.config.version,
            "callback_url": self.config.callback_url,
        }

        headers = {
            "Authorization": f"Bearer {self.config.control_core_key}",
        }
"""
class RegisterRequest(BaseModel):
    reporter_uid: str
    version: VersionModel | str
    callback_url: str | None = None


class ReporterFilePayload(BaseModel):
    reporter_uid: str
    path: str
    modified_time: float
    content: str


class ParserModel(BaseModel):
    name: str
    version: VersionModel | str


class ContainerModel(BaseModel):
    id: str
    name: str
    status: str
    started_at: datetime


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
    parser_version: VersionModel | str


# class HistoryModel(BaseModel):
#     pass


# class ErrorsModel(BaseModel):
#     pass


class CollectorModel(BaseModel):
    collector_version: VersionModel | str
    updated_at: datetime
    last_reconciled_at: datetime
    last_log_at: datetime
    history_dropped: int
    errors_dropped: int


class ServerUpdatePOST(BaseModel):
    schema_version: float | int
    server_name: str
    game_name: str

    parser: ParserModel
    container: ContainerModel
    health: HealthModel
    latest_status: LatestStatusModel
    history: list
    errors: list
    collector: CollectorModel


class ServerUpdatePUT(BaseModel):
    schema_version: float | int
    server_name: str
    game_name: str

    parser: ParserModel | None = None
    container: ContainerModel | None = None
    health: HealthModel | None = None
    latest_status: LatestStatusModel | None = None
    history: list | None = None
    errors: list | None = None
    collector: CollectorModel | None = None

# Responses
