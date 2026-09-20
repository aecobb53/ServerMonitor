import os
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, ORJSONResponse
from datetime import datetime, timezone
import json
from pathlib import Path

import logging

from common.exceptions import ServerNotFoundError, AuthenticationError
logger = logging.getLogger(__name__)


from common.models import ResponseObject

from common.utils import DATA_DIR, SERVERS_DIR, parse_timestamp, find_servers, find_game_servers, find_specific_server, find_game_info

from .models import (
    LoginPayload,
    AdminHeaderSchema,
    AdminPageData,
    ModPatchBody,
)
from .handler import verify_admin_password
from fastapi import Depends



login_router = APIRouter(
    prefix='/api/admin/login',
    tags=['server', 'login', 'admin'],
)

admin_router = APIRouter(
    prefix='/api/admin',
    tags=['server', 'admin'],
    dependencies=[Depends(verify_admin_password)]  # <-- Enforces check for ALL endpoints under this router
)


@login_router.post('', status_code=200)
def admin_login(login_payload: LoginPayload) -> ResponseObject:
    # TODO: Add backoff
    ADMIN_PASSWORD = os.environ.get("SERVER_ADMIN_PASSWORD")
    if login_payload.password != ADMIN_PASSWORD:
        raise AuthenticationError
    return {
        "success": True,
        "data": None
    }

@admin_router.get('/login', status_code=200)
def admin_page() -> ResponseObject:
    # data: AdminPageData = {
    data = {
    "servers": [
      {
        "name": "valheim-main",
        "container": {
          "status": "UP",
          "cpu_usage": 12.4,
          "disk_usage": "42 GB / 916 GB",
          "errors": []
        },
        "server": {
          "status": "UP",
          "errors": []
        },
        "mods": [
          {
            "name": "ExampleMod",
            "enabled": True,
            "version": "1.2.3"
          },
          {
            "name": "AnotherMod",
            "enabled": False,
            "version": "2.4.1"
          }
        ]
      },
      {
        "name": "valheim-test",
        "container": {
          "status": "DOWN",
          "cpu_usage": 0,
          "disk_usage": "18 GB / 200 GB",
          "errors": [
            "Container exited unexpectedly"
          ]
        },
        "server": {
          "status": "DOWN",
          "errors": [
            "Server not responding"
          ]
        },
        "mods": []
      }
    ],
    "carousel": [
      {
        "image": "/media/example.jpg",
        "title": "Our latest adventure"
      }
    ],
    "feed": [
      {
        "text": "Server event occurred."
      },
      {
        "text": "New screenshot uploaded."
      }
    ],
    "whats_new": [
      {
        "text": "New server update!"
      },
      {
        "text": "Boss fight Saturday."
      }
    ]
  }
    return {
        "success": True,
        "data": data
    }

@admin_router.post('/servers/{server_name}/start', status_code=200)
def start_game_server(server_name: str) -> ResponseObject:
    # Verify state (if already started do nothing, if not running execute a start)
    # Create window to restart server
    # Verify server start has started
    data = {
        "server": server_name,
        "action": 'start'
    }
    return {
        "success": True,
        "data": data
    }

@admin_router.post('/servers/{server_name}/restart', status_code=200)
def restart_game_server(server_name: str) -> ResponseObject:
    # Verify state (if not started do nothing, if running execute a restart)
    # Create window to restart server
    # Verify server restart has started
    data = {
        "server": server_name,
        "action": 'restart'
    }
    return {
        "success": True,
        "data": data
    }

@admin_router.patch('/servers/{server_name}/mods/{mod_name}', status_code=200)
def patch_mods(server_name: str, mod_name: str, mod_patch_body: ModPatchBody) -> ResponseObject:
    # TODO: Somehow track when a server needs a restart when any mods have been updated
    # TODO: Look into a way to have the mods list different than the docker compose file
    data = {
        "name": mod_name,
        "enabled": mod_patch_body['enabled'],
        "version": mod_patch_body['version'],
        "restart_required": True
    }
    return {
        "success": True,
        "data": data
    }

# @admin_router.put('/whats-new', status_code=200)
# def modify_whats_new(whats_new_body: WhatsNewBody) -> ResponseObject:
#     # TODO: Somehow track when a server needs a restart when any mods have been updated
#     # TODO: Look into a way to have the mods list different than the docker compose file
#     data = {
#         "text": whats_new_body['text']
#     }
#     return {
#         "success": True,
#         "data": data
#     }
