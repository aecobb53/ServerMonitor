import os
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, ORJSONResponse
from datetime import datetime, timezone
import json
from pathlib import Path

import logging

from common.exceptions import ServerNotFoundError
logger = logging.getLogger(__name__)


from common.models import ResponseObject

from common.utils import DATA_DIR, SERVERS_DIR, parse_timestamp, find_servers, find_game_servers, find_specific_server, find_game_info

from .models import (
    ContainerStatusEnum,
    ServerStatusEnum,
    BaseResponse,
    ServerStatusServer,
    ServerStatusGame,
    GETServerStatusResponse,
)

router = APIRouter(
    prefix='/api',
    tags=['server'],
)


@router.get('/server-status', status_code=200)
def server_status() -> ResponseObject:


    # TODO this needs to look in the servers dir for servers that do not have active
    # TODO map the outputs to the base model objects not just a dict
    games = []

    for game, game_servers in find_game_servers().items():
        game_payload = {
            "name": game,
            "image": "SERVER IIMAGE",
            "servers": [],
        }
        for server in game_servers:
            if not len(server['server_status_list']):
                continue
            if server['server_name'] == "Unknown Server Name":
                continue
            current_status = server['latest_status']
            game_payload['servers'].append({
                "id": server['container_id'],
                "name": server['server_name'],
                "game": server.get('game_name', 'unknown'),
                "container_status": server['container_status'].upper(),
                "server_status": current_status['status'],
                "healthy": True,
                "last_message": current_status['message'],
                "updated": datetime.strptime(current_status['timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ"),
            })
        games.append(game_payload)

    response = GETServerStatusResponse(
        last_updated=datetime.now(timezone.utc),
        games=games,
    )

    return {
        "success": True,
        "data": response
    }


@router.get('/server-info/{server_name}', status_code=200)
def server_info(server_name: str) -> ResponseObject:
    for server in os.listdir(SERVERS_DIR):
        with open(SERVERS_DIR / server) as sf:
            server_info = json.load(sf)
            if server_info['server_name'] == server_name:
                break
    else:
        raise ServerNotFoundError(f"The server named {server_name} was not found")
    server_info = find_game_info(server_name=server_name)
    server = find_specific_server(server_name=server_name)
    if server:
        container_status = server['container_status']
        display_status = server['latest_status']['status']
        latest_timestamp = server['latest_status']['timestamp']
        server_status_list = server['server_status_list']
        quick_info = {}
        """
        quick_info = {
            "world": "Hellheim_02",
            "server_version": "0.219.14",
            "modpack_version": "bepinex-5.4.23",
            "last_restart": "2026-07-27T12:00:00Z",
            "uptime_seconds": 25920,
            "max_players": 10,
            "time_zone": "UTC"
        },
        """
    else:
        logger.warning(f"The server {server_name} does not have a history of running")
        container_status = 'unknown'
        display_status = 'UNKNOWN'
        latest_timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        server_status_list = []
        quick_info = {}

    response = {
        "server_name": server_info['server_name'],
        "display_name": server_info['display_name'],
        "game": server_info['game'],
        "description": server_info['description'],
        "container_status": container_status,
        "display_status": display_status,
        "timestamp": latest_timestamp,
        "quick_info": quick_info,
        "server_status_list": server_status_list
    }
    return {
        "success": True,
        "data": response
    }

@router.get('/servers/{server_name}/news', status_code=200)
def server_news(server_name: str) -> ResponseObject:
    server_info = find_game_info(server_name=server_name)
    return {
        "success": True,
        "data": server_info['news']
    }

@router.get('/servers/{server_name}/rules', status_code=200)
def server_rules(server_name: str) -> ResponseObject:
    server_info = find_game_info(server_name=server_name)
    return {
        "success": True,
        "data": server_info['rules']
    }

# ##############################################
# import os
# import secrets
# from secrets import compare_digest

# from fastapi import APIRouter, Depends, HTTPException, Request, Response
# from pydantic import BaseModel


# ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

# # Simple in-memory session storage for now.
# admin_sessions: set[str] = set()
# # TODO: improve to add a timeout and persist between server restarts
# # TODO: Add cookie experation
# # TODO: Add rate limiting

# class AdminLogin(BaseModel):
#     password: str

# def validate_admin_session(session_token: str) -> bool:
#     return session_token in admin_sessions

# def require_admin(request: Request) -> None:
#     session_token = request.cookies.get("admin_session")

#     if not session_token or not validate_admin_session(session_token):
#         raise HTTPException(status_code=401, detail="Authentication required")

# auth_router = APIRouter(prefix="/admin-auth", tags=["admin", 'auth'])
# admin_router = APIRouter(
#     prefix="/api/admin",
#     tags=['server', 'admin'],
#     dependencies=[Depends(require_admin)],
# )

# @auth_router.post("/login", status_code=200)
# def admin_login(payload: AdminLogin, response: Response) -> ResponseObject:
#     if not compare_digest(payload.password, ADMIN_PASSWORD):
#         raise HTTPException(status_code=404)  # Yes I know this is intentional. 
#         # raise HTTPException(status_code=401, detail="Invalid password")

#     session_token = secrets.token_urlsafe(32)
#     admin_sessions.add(session_token)

#     response.set_cookie(
#         key="admin_session",
#         value=session_token,
#         secure=True,
#         httponly=True,
#         samesite="strict",
#     )

#     return {
#         "success": True,
#         "data": None,
#     }

# @admin_router.put("/servers/{server_name}/news", status_code=200)
# def update_server_news(
#     server_name: str,
#     payload: NewsUpdate,
# ) -> ResponseObject:
#     server_info = find_game_info(server_name=server_name)

#     server_info["news"] = payload.news
#     save_game_info(server_name, server_info)

#     return {
#         "success": True,
#         "data": server_info["news"],
#     }

# def save_game_info(server_name: str, server_info: dict) -> None:
#     server_file_path = SERVERS_DIR / f"{server_name}.json"
#     with open(server_file_path, "w") as f:
#         json.dump(server_info, f, indent=4)
