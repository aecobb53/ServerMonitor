from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Any

# Requests

# Responses


class ContainerStatusEnum(Enum):
    RUNNING = "RUNNING"
    STOPPED = "STOPPED"
    UNKNOWN = "UNKNOWN"


class ServerStatusEnum(Enum):
    STARTING = 'STARTING'
    UPDATING = 'UPDATING'
    INSTALLING_MODS = 'INSTALLING_MODS'
    REGISTERING = 'REGISTERING'
    ONLINE = 'ONLINE'
    UNKNOWN = 'UNKNOWN'
    OFFLINE = 'OFFLINE'


class BaseResponse(BaseModel):
    success: bool
    data: dict | list | None = None


class ServerStatusServer(BaseModel):
    id: str
    name: str
    game: str
    container_status: ContainerStatusEnum
    server_status: ServerStatusEnum
    healthy: bool
    last_message: str
    updated: datetime


class ServerStatusGame(BaseModel):
    image: str
    servers: list[ServerStatusServer]


class GETServerStatusResponse(BaseModel):
    last_updated: datetime
    games: list[ServerStatusGame]


# class ServiceResponse(BaseModel):
#     success: bool
#     data: Any | None = None
