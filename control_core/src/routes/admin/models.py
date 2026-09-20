from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from typing import Any

# Requests

class LoginPayload(BaseModel):
    password: str


class AdminHeaderSchema(BaseModel):
    # Field alias maps 'X-Admin-Password' from the request to 'x_admin_password'
    x_admin_password: str = Field(
        ...,
        alias="X-Admin-Password",
        description="The administrator access password"
    )

    class Config:
        # This populates the exact dictionary format in OpenAPI/Swagger docs
        json_schema_extra = {
            "example": {"X-Admin-Password": "<admin-password>"}
        }


# Responses

class ServerContentContainer(BaseModel):
    status: str
    cpu_usage: float
    disk_usage: str
    errors: list[str]


class ServerContentServer(BaseModel):
    status: str
    errors: list[str]


class ServerContentMods(BaseModel):
    name: str
    enabled: bool
    version: str


class AdminPageDetailsServers(BaseModel):
    name: str
    container: ServerContentContainer
    server: ServerContentServer
    mods: list[ServerContentMods]


class CarouselContent(BaseModel):
    id: str
    image: str
    alt: str
    title: str
    subtitle: str
    href: str


class AdminCarouselServers(BaseModel):
    list[CarouselContent]


class AdminFeedServers(BaseModel):
    dict


class AdminWhatsNewServers(BaseModel):
    list[str]


class AdminPageData(BaseModel):
    servers: list[AdminPageDetailsServers]
    carousel: AdminCarouselServers
    feed: AdminFeedServers
    whats_new: AdminWhatsNewServers


class ModPatchBody(BaseModel):
    enabled: bool
    version: str
