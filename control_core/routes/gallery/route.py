import os
import re
from fastapi import APIRouter, HTTPException, Request, Depends, File, Form, UploadFile
from fastapi.responses import HTMLResponse, ORJSONResponse, FileResponse
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Annotated

import logging

from common.exceptions import ServerNotFoundError
logger = logging.getLogger(__name__)


from common.models import ResponseObject
from common.utils import DATA_DIR, SERVERS_DIR, parse_timestamp, find_servers, find_game_servers, find_specific_server, find_game_info, REQUESTS_DIR, IMAGES_DIR

from .models import GalleryQueryParams, GalleryDataObject, GalleryLegendObject, GalleryDataObject

gallery_router = APIRouter(
    prefix='/api/gallery',
    tags=['gallery'],
)
map_router = APIRouter(
    prefix='/api/maps',
    tags=['maps'],
)

def save_file(image_path: str, content: bytes) -> None:
    os.makedirs(os.path.dirname(image_path), exist_ok=True)
    with open(image_path, 'wb') as f:
        f.write(content)

def save_manifest(manifest_path: str, manifest_data: dict) -> None:
    os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
    with open(manifest_path, 'w') as mf:
        json.dump(manifest_data, mf)

def next_gallery_id() -> str:
    id_number = 0
    for existing_file in (IMAGES_DIR / "manifest_files").glob("gal-*.json"):
        match = re.match(r".*gal-(\d+)\.json", str(existing_file))
        if match:
            id_number = max(id_number, int(match.group(1)))
    id_number += 1
    return f"gal-{id_number:03d}"

@gallery_router.get('', status_code=200)
def gallery(query: Annotated[GalleryQueryParams, Depends()]) -> ResponseObject:
    response = []
    for fl in (IMAGES_DIR / "manifest_files").glob("*gal-*.json"):
        with open(fl, "r") as f:
            print(f"READING FILE: {fl}")
            data = json.load(f)
            response.append(data)
    return {
        "success": True,
        "data": response
    }

@gallery_router.post('', status_code=201)
def create_gallery(new_resource: GalleryDataObject) -> ResponseObject:
    return {
        "success": True,
        "data": new_resource
    }


@gallery_router.post('/upload', status_code=201)
async def upload_gallery_images(
    files: list[UploadFile] | None = File(default=None),
    server: str | None = Form(default=None),
    title: str | None = Form(default=None),
    description: str | None = Form(default=None),
) -> ResponseObject:
    upload_files = files or []

    print(f"File upload request received with {len(upload_files)} files.")

    gallery_path = IMAGES_DIR / "gallery"
    manifest_path = IMAGES_DIR / "manifest_files"

    uploaded_files = []
    for upload in upload_files:
        content = await upload.read()
        uploaded_files.append({
            "filename": upload.filename,
            "content_type": upload.content_type,
            "size_bytes": len(content),
        })

    manifest = GalleryDataObject(
        id=next_gallery_id(),
        server=server,
        title=title,
        description=description,
        media_count=1,
        preview_url=f"/api/gallery/{next_gallery_id()}/media/{upload.filename}",
        media_urls=[f"/api/gallery/{next_gallery_id()}/media/{upload.filename}"],
        created_at=datetime.now(timezone.utc)
    )

    return {
        "success": True,
        "data": {
            "server": server,
            "title": title,
            "description": description,
            "file_count": len(uploaded_files),
            "files": uploaded_files,
            "saved": False,
        }
    }

@gallery_router.get('/{id}/media/{filename}', status_code=200)
def gallery_item(id: str, filename: str) -> ResponseObject:
    image_path = Path(IMAGES_DIR) / "gallery" / f"{filename}.png"
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(
        path=image_path,
        media_type="image/png",
        filename=image_path.name,
    )

@map_router.get('/{server}', status_code=200)
def map(server: str) -> ResponseObject:
    manifest_path = Path(IMAGES_DIR) / "manifest_files" / f"{server}.map.json"
    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="Map manifest not found")
    with open(manifest_path) as mf:
        manifest_content = json.load(mf)
    return {
        "success": True,
        "data": manifest_content
    }

@map_router.get('/{server}/image', status_code=200)
def map_item(server: str) -> ResponseObject:
    image_path = Path(IMAGES_DIR) / "maps" / f"{server}.png"
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(
        path=image_path,
        media_type="image/png",
        filename=image_path.name,
    )
