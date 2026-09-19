import os
import re
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import HTMLResponse, ORJSONResponse, FileResponse
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Annotated

import logging

from common.exceptions import ServerNotFoundError
logger = logging.getLogger(__name__)


from common.models import ResponseObject
from common.utils import DATA_DIR, SERVERS_DIR, parse_timestamp, find_servers, find_game_servers, find_specific_server, find_game_info, IMAGES_DIR, EVENTS_DIR

from .models import EventsQueryParams, EventDataObject

router = APIRouter(
    prefix='/api/events',
    tags=['events'],
)

@router.get('', status_code=200)
def events(query: Annotated[EventsQueryParams, Depends()]) -> ResponseObject:
    response = []
    for fl in EVENTS_DIR.glob("*.json"):
        with open(fl, "r") as f:
            data = json.load(f)
            response.append(data)
    return {
        "success": True,
        "data": response
    }

@router.post('', status_code=201)
def create_event(new_event: EventDataObject) -> ResponseObject:
    server = find_specific_server(server_name=new_event.server)
    if not server:
        raise ServerNotFoundError(f"The server {new_event['server']} does not exist")
    logger.info(f"Creating Event")
    evt_id_number = 0
    for request_fl in EVENTS_DIR.glob("evt-*.json"):
        match = re.match(r".*evt-(\d+)\.json", str(request_fl))
        evt_id_number = max(evt_id_number, int(match.group(1)))
    evt_id_number += 1
    evt_id = f"evt-{evt_id_number:03d}"
    new_event.id = evt_id

    with open(EVENTS_DIR / f"{evt_id}.json", 'w') as jf:
        jf.write(json.dumps(new_event.to_json, indent=4))

    return {
        "success": True,
        "data": new_event
    }

@router.put('/{event_id}', status_code=201)
def update_event(event_id: str, event_content: EventDataObject) -> ResponseObject:
    server = find_specific_server(server_name=event_content.server)
    if not server:
        raise ServerNotFoundError(f"The server {event_content['server']} does not exist")
    logger.info(f"Updating Event")
    event_file = EVENTS_DIR / f"{event_id}.json"
    with open(event_file, 'r') as ef:
        current_event = json.load(ef)
    current_event = EventDataObject.from_json(current_event)
    current_time = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    if current_event.title != event_content.title:
        current_event.changelog.append(f"{current_time} Changed title from {current_event.title} to {event_content.title}")
        current_event.title = event_content.title
    if current_event.description != event_content.description:
        current_event.changelog.append(f"{current_time} Changed description from {current_event.description} to {event_content.description}")
        current_event.description = event_content.description
    if current_event.event_date != event_content.event_date:
        current_event.changelog.append(f"{current_time} Changed event_date from {current_event.event_date} to {event_content.event_date}")
        current_event.event_date = event_content.event_date
    if current_event.start_time != event_content.start_time:
        current_event.changelog.append(f"{current_time} Changed start_time from {current_event.start_time} to {event_content.start_time}")
        current_event.start_time = event_content.start_time
    if current_event.end_time != event_content.end_time:
        current_event.changelog.append(f"{current_time} Changed end_time from {current_event.end_time} to {event_content.end_time}")
        current_event.end_time = event_content.end_time
    if current_event.meetup_location != event_content.meetup_location:
        current_event.changelog.append(f"{current_time} Changed meetup_location from {current_event.meetup_location} to {event_content.meetup_location}")
        current_event.meetup_location = event_content.meetup_location
    if current_event.expanded_details != event_content.expanded_details:
        current_event.changelog.append(f"{current_time} Changed expanded_details from {current_event.expanded_details} to {event_content.expanded_details}")
        current_event.expanded_details = event_content.expanded_details
    if current_event.quick_links != event_content.quick_links:
        current_event.changelog.append(f"{current_time} Changed quick_links from {current_event.quick_links} to {event_content.quick_links}")
        current_event.quick_links = event_content.quick_links
    # if current_event.image_url != event_content.image_url:
    #     current_event.changelog.append(f"{current_time} Changed image_url from {current_event.image_url} to {event_content.image_url}")
    #     current_event.image_url = event_content.image_url
    current_event.updated_at = datetime.now(timezone.utc)
    with open(event_file, 'w') as jf:
        jf.write(json.dumps(current_event.to_json, indent=4))

    return {
        "success": True,
        "data": current_event
    }

@router.get('/{id}/image', status_code=200)
def event_image(id: str) -> ResponseObject:
    image_path = Path(IMAGES_DIR) / f"{id}.png"
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(
        path=image_path,
        media_type="image/png",
        filename=image_path.name,
    )

