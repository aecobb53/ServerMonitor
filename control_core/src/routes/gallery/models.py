import json

from datetime import datetime
from pydantic import BaseModel


class GalleryQueryParams(BaseModel):
    id: str | None = None
    server: str | None = None


class GalleryDataObject(BaseModel):
    id: str
    server: str
    title: str
    description: str
    media_count: int
    preview_url: str
    media_urls: list[str]
    created_at: datetime


class GalleryLegendObject(BaseModel):
    symbol: str
    label: str


# class GalleryDataObject(BaseModel):
#     server: str
#     description: str
#     last_updated: datetime
#     image_url: str
#     legend: list[GalleryLegendObject]



# {
#     "id": "gal-007",
#     "server": "RockandStone",
#     "title": "Fader",
#     "description": "",
#     "media_count": 1,
#     "preview_url": "/api/gallery/gal-007/media/Fader",
#     "media_urls": [
#     "/api/gallery/gal-007/media/Fader"
#     ],
#     "created_at": "2026-07-30T20:15:00Z"
# }