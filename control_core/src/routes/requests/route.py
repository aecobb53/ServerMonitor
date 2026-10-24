import os
import re
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import HTMLResponse, ORJSONResponse
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Annotated

import logging

from common.exceptions import ServerNotFoundError
logger = logging.getLogger(__name__)


from common.models import ResponseObject
from common.utils import DATA_DIR, EVENTS_DIR, SERVERS_DIR, parse_timestamp, find_servers, find_game_servers, find_specific_server, find_game_info, REQUESTS_DIR
from .logic import find_requests

from .models import RequestsQueryParams, RequestDataUrgency, RequestDataObject

router = APIRouter(
    prefix='/api',
    tags=['requests'],
)

@router.get('/requests', status_code=200)
def requests(query: Annotated[RequestsQueryParams, Depends()]):
    response = find_requests(query=query)
    return {
        "success": True,
        "data": response
    }


@router.post('/requests', status_code=201)
def create_requests(creation_object: RequestDataObject):
    server = find_specific_server(server_name=creation_object.server)
    if not server:
        raise ServerNotFoundError(f"The server {creation_object['server']} does not exist")
    logger.info(f"Creating Request")
    req_id_number = 0
    for request_fl in REQUESTS_DIR.glob("req-*.json"):
        match = re.match(r".*req-(\d+)\.json", str(request_fl))
        req_id_number = max(req_id_number, int(match.group(1)))
    req_id_number += 1
    req_id = f"req-{req_id_number:03d}"
    creation_object.id = req_id

    with open(REQUESTS_DIR / f"{req_id}.json", 'w') as jf:
        jf.write(json.dumps(creation_object.to_json, indent=4))

    return {
        "success": True,
        "data": creation_object
    }


@router.put('/requests/{request_id}', status_code=200)
def update_requests(request_id: str, update_object: RequestDataObject):
    server = find_specific_server(server_name=update_object.server)
    if not server:
        raise ServerNotFoundError(f"The server {update_object['server']} does not exist")
    logger.info(f"Updating Event")
    request_file = REQUESTS_DIR / f"{request_id}.json"
    with open(request_file, 'r') as ef:
        current_request_object = json.load(ef)
    current_request_object = RequestDataObject.from_json(current_request_object)
    current_time = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    if current_request_object.title != update_object.title:
        current_request_object.changelog.append(f"{current_time} Changed title from {current_request_object.title} to {update_object.title}")
        current_request_object.title = update_object.title
    if current_request_object.requested_by != update_object.requested_by:
        current_request_object.changelog.append(f"{current_time} Changed requested_by from {current_request_object.requested_by} to {update_object.requested_by}")
        current_request_object.requested_by = update_object.requested_by
    if current_request_object.urgency != update_object.urgency:
        current_request_object.changelog.append(f"{current_time} Changed urgency from {current_request_object.urgency} to {update_object.urgency}")
        current_request_object.urgency = update_object.urgency
    if current_request_object.description != update_object.description:
        current_request_object.changelog.append(f"{current_time} Changed description from {current_request_object.description} to {update_object.description}")
        current_request_object.description = update_object.description
    if current_request_object.quick_links != update_object.quick_links:
        current_request_object.changelog.append(f"{current_time} Changed quick_links from {current_request_object.quick_links} to {update_object.quick_links}")
        current_request_object.quick_links = update_object.quick_links
    if current_request_object.completed != update_object.completed:
        current_request_object.changelog.append(f"{current_time} Changed completed from {current_request_object.completed} to {update_object.completed}")
        current_request_object.completed = update_object.completed
    if current_request_object.archived != update_object.archived:
        current_request_object.changelog.append(f"{current_time} Changed archived from {current_request_object.archived} to {update_object.archived}")
        current_request_object.archived = update_object.archived

    current_request_object.updated_at = datetime.now(timezone.utc)

    with open(request_file, 'w') as jf:
        jf.write(json.dumps(current_request_object.to_json, indent=4))

    return {
        "success": True,
        "data": current_request_object
    }
