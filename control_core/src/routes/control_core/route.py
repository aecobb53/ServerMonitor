import logging
import os
import secrets

logger = logging.getLogger(__name__)

from fastapi import APIRouter, HTTPException, Header

from .models import (
    ServerUpdatePOST,
    ServerUpdatePUT,
    RegisterRequest,
)
from .handler import tracked_reporters

router = APIRouter(
    prefix='/control-core',
    tags=['control-core'],
)
"""
POST /control-core/register
POST /control-core/files
PATCH /control-core/files
POST /control-core/files/deleted
"""

def _require_reporter_password(server_password: str | None) -> None:
    expected_password = os.getenv("CONTROL_CORE_KEY")
    if not expected_password or not server_password or not secrets.compare_digest(server_password, expected_password):
        logger.warning("Rejecting reporter request with invalid credentials")
        raise HTTPException(status_code=404, detail="Server not found")


@router.post('/register', status_code=201)
def register_reporter(
    registration: RegisterRequest,
    server_password: str | None = Header(default=None),
    reporter_key: str = Header(..., ),
    ):
    _require_reporter_password(server_password)

    if reporter_key in tracked_reporters:
        tracked_reporters.update_registered_reporter(
            reporter_key=reporter_key,
            updated_registration=registration,
        )
    else:
        tracked_reporters.add_registered_reporter(
            reporter_key=reporter_key,
            registration=registration,
        )

    return {
        "success": True,
        "data": "Registered"
    }

@router.post('/files', status_code=200)
def receive_reporter_file(
    report: ServerUpdatePOST,
    reporter_key: str = Header(..., ),
    server_password: str | None = Header(default=None),
    ):
    _require_reporter_password(server_password)
    if reporter_key not in tracked_reporters:
        logger.warning(f"Reporter {reporter_key} is not registered; rejecting file upload")
        raise HTTPException(status_code=404, detail="Server not found")

    try:
        tracked_reporters.add_tracked_server(
            reporter_key=reporter_key,
            report=report,
        )
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

    return {
        "success": True,
        "data": "Received"
    }

@router.patch('/files', status_code=200)
def patch_reporter_file(
    report: ServerUpdatePUT,
    reporter_key: str = Header(..., ),
    server_password: str | None = Header(default=None),
    ):
    _require_reporter_password(server_password)
    if reporter_key not in tracked_reporters:
        logger.warning(f"Reporter {reporter_key} is not registered; rejecting file upload")
        raise HTTPException(status_code=404, detail="Server not found")

    if not tracked_reporters.has_tracked_server(reporter_key, report.server_name):
        raise HTTPException(status_code=404, detail="Server not found")

    tracked_reporters.update_tracked_server(
        reporter_key=reporter_key,
        server_name=report.server_name,
        updated_report=report,
    )
    return {
        "success": True,
        "data": "Received"
    }

# app.include_router(router)

# @router.delete('/files', status_code=204)
# def register_reporter():
#     return {
#         "success": True,
#         "data": None
#     }

# router = APIRouter(
#     prefix='/api',
#     tags=['server'],
# )


# @router.get('/server-status', status_code=200)
# def server_status() -> ResponseObject:


#     # TODO this needs to look in the servers dir for servers that do not have active
#     # TODO map the outputs to the base model objects not just a dict
#     games = []

#     for game, game_servers in find_game_servers().items():
#         game_payload = {
#             "name": game,
#             "image": "SERVER IIMAGE",
#             "servers": [],
#         }
#         for server in game_servers:
#             if not len(server['server_status_list']):
#                 continue
#             if server['server_name'] == "Unknown Server Name":
#                 continue
#             current_status = server['latest_status']
#             game_payload['servers'].append({
#                 "id": server['container_id'],
#                 "name": server['server_name'],
#                 "game": server.get('game_name', 'unknown'),
#                 "container_status": server['container_status'].upper(),
#                 "server_status": current_status['status'],
#                 "healthy": True,
#                 "last_message": current_status['message'],
#                 "updated": datetime.strptime(current_status['timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ"),
#             })
#         games.append(game_payload)

#     response = GETServerStatusResponse(
#         last_updated=datetime.now(timezone.utc),
#         games=games,
#     )

#     return {
#         "success": True,
#         "data": response
#     }


# @router.get('/server-info/{server_name}', status_code=200)
# def server_info(server_name: str) -> ResponseObject:
#     for server in os.listdir(SERVERS_DIR):
#         with open(SERVERS_DIR / server) as sf:
#             server_info = json.load(sf)
#             if server_info['server_name'] == server_name:
#                 break
#     else:
#         raise ServerNotFoundError(f"The server named {server_name} was not found")
#     server_info = find_game_info(server_name=server_name)
#     server = find_specific_server(server_name=server_name)
#     if server:
#         container_status = server['container_status']
#         display_status = server['latest_status']['status']
#         latest_timestamp = server['latest_status']['timestamp']
#         server_status_list = server['server_status_list']
#         quick_info = {}
#         """
#         quick_info = {
#             "world": "Hellheim_02",
#             "server_version": "0.219.14",
#             "modpack_version": "bepinex-5.4.23",
#             "last_restart": "2026-07-27T12:00:00Z",
#             "uptime_seconds": 25920,
#             "max_players": 10,
#             "time_zone": "UTC"
#         },
#         """
#     else:
#         logger.warning(f"The server {server_name} does not have a history of running")
#         container_status = 'unknown'
#         display_status = 'UNKNOWN'
#         latest_timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
#         server_status_list = []
#         quick_info = {}

#     response = {
#         "server_name": server_info['server_name'],
#         "display_name": server_info['display_name'],
#         "game": server_info['game'],
#         "description": server_info['description'],
#         "container_status": container_status,
#         "display_status": display_status,
#         "timestamp": latest_timestamp,
#         "quick_info": quick_info,
#         "server_status_list": server_status_list
#     }
#     return {
#         "success": True,
#         "data": response
#     }

# @router.get('/servers/{server_name}/news', status_code=200)
# def server_news(server_name: str) -> ResponseObject:
#     server_info = find_game_info(server_name=server_name)
#     return {
#         "success": True,
#         "data": server_info['news']
#     }

# @router.get('/servers/{server_name}/rules', status_code=200)
# def server_rules(server_name: str) -> ResponseObject:
#     server_info = find_game_info(server_name=server_name)
#     return {
#         "success": True,
#         "data": server_info['rules']
#     }

# # ##############################################
# # import os
# # import secrets
# # from secrets import compare_digest

# # from fastapi import APIRouter, Depends, HTTPException, Request, Response
# # from pydantic import BaseModel


# # ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

# # # Simple in-memory session storage for now.
# # admin_sessions: set[str] = set()
# # # TODO: improve to add a timeout and persist between server restarts
# # # TODO: Add cookie experation
# # # TODO: Add rate limiting

# # class AdminLogin(BaseModel):
# #     password: str

# # def validate_admin_session(session_token: str) -> bool:
# #     return session_token in admin_sessions

# # def require_admin(request: Request) -> None:
# #     session_token = request.cookies.get("admin_session")

# #     if not session_token or not validate_admin_session(session_token):
# #         raise HTTPException(status_code=401, detail="Authentication required")

# # auth_router = APIRouter(prefix="/admin-auth", tags=["admin", 'auth'])
# # admin_router = APIRouter(
# #     prefix="/api/admin",
# #     tags=['server', 'admin'],
# #     dependencies=[Depends(require_admin)],
# # )

# # @auth_router.post("/login", status_code=200)
# # def admin_login(payload: AdminLogin, response: Response) -> ResponseObject:
# #     if not compare_digest(payload.password, ADMIN_PASSWORD):
# #         raise HTTPException(status_code=404)  # Yes I know this is intentional. 
# #         # raise HTTPException(status_code=401, detail="Invalid password")

# #     session_token = secrets.token_urlsafe(32)
# #     admin_sessions.add(session_token)

# #     response.set_cookie(
# #         key="admin_session",
# #         value=session_token,
# #         secure=True,
# #         httponly=True,
# #         samesite="strict",
# #     )

# #     return {
# #         "success": True,
# #         "data": None,
# #     }

# # @admin_router.put("/servers/{server_name}/news", status_code=200)
# # def update_server_news(
# #     server_name: str,
# #     payload: NewsUpdate,
# # ) -> ResponseObject:
# #     server_info = find_game_info(server_name=server_name)

# #     server_info["news"] = payload.news
# #     save_game_info(server_name, server_info)

# #     return {
# #         "success": True,
# #         "data": server_info["news"],
# #     }

# # def save_game_info(server_name: str, server_info: dict) -> None:
# #     server_file_path = SERVERS_DIR / f"{server_name}.json"
# #     with open(server_file_path, "w") as f:
# #         json.dump(server_info, f, indent=4)
