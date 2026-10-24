import json
import logging
import os
import secrets
import threading
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Annotated, Literal

import requests
from fastapi import APIRouter, Depends, Header, HTTPException, Request

from common.models import ResponseObject
from common.utils import find_specific_server
from .admin_models import ServerAdminLoginPayload, ServerAdminPATCH
from .handler import tracked_reporters
from .models import ReporterServerContent

logger = logging.getLogger(__name__)

FAILED_ATTEMPT_LIMIT = 10
FAILED_ATTEMPT_WINDOW_SECONDS = 300

admin_login_router = APIRouter(prefix='/control-core/admin/login', tags=['control-core', 'login', 'admin'])
admin_server_router = APIRouter(prefix='/control-core/admin/servers', tags=['control-core', 'admin'])

_failed_attempts: dict[str, deque] = defaultdict(deque)
_write_lock = threading.Lock()


def _matches(candidate: str | None, expected: str | None) -> bool:
    if not candidate or not expected:
        return False
    return secrets.compare_digest(candidate.encode(), expected.encode())


def _reporter_passwords() -> dict[str, str]:
    try:
        parsed = json.loads(os.getenv("REPORTER_ADMIN_PASSWORDS") or "{}")
    except ValueError:
        parsed = None
    if not isinstance(parsed, dict):
        logger.error("REPORTER_ADMIN_PASSWORDS must be a JSON object; ignoring reporter passwords")
        return {}
    return {str(uid): str(password) for uid, password in parsed.items()}


def _find_server_info(server_slug: str) -> dict:
    content = tracked_reporters.find_server_content(server_slug)
    if content is None:
        raise HTTPException(status_code=404, detail="The requested server does not exist.")
    return content.model_dump()


def _authorize(request: Request, server_slug: str, password: str | None, *, login: bool) -> dict:
    info = _find_server_info(server_slug)

    client = request.client.host if request.client else "unknown"
    attempts = _failed_attempts[client]
    while attempts and attempts[0] < time.monotonic() - FAILED_ATTEMPT_WINDOW_SECONDS:
        attempts.popleft()
    if len(attempts) >= FAILED_ATTEMPT_LIMIT:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    master_password = os.getenv("SERVER_ADMIN_PASSWORD")
    if not master_password:
        logger.error("SERVER_ADMIN_PASSWORD is not set")
        raise HTTPException(status_code=500, detail="Admin is not available.")

    if _matches(password, master_password):
        return info

    owner_uid = tracked_reporters.find_reporter_uid(server_slug)
    reporter_passwords = _reporter_passwords()
    if owner_uid and _matches(password, reporter_passwords.get(owner_uid)):
        return info

    attempts.append(time.monotonic())
    logger.warning(f"Rejected server admin credentials: server={server_slug}")

    # A password valid only for another reporter is a permission problem, not a bad password.
    if not login and any(uid != owner_uid and _matches(password, other) for uid, other in reporter_passwords.items()):
        raise HTTPException(status_code=403, detail="This password does not have access to that server.")
    raise HTTPException(status_code=401, detail="Invalid admin password.")


def _authorized_server(
    request: Request,
    server_slug: str,
    x_admin_password: Annotated[str | None, Header(alias="X-Admin-Password")] = None,
) -> dict:
    return _authorize(request, server_slug, x_admin_password, login=False)


AuthorizedServer = Annotated[dict, Depends(_authorized_server)]


def _build_page_data(info: dict) -> dict:
    server = find_specific_server(info['server_name'])
    page_info = {
        key: info.get(key, default)
        for key, default in (
            ("server_name", None), ("game", None), ("display_name", None),
            ("description", ''), ("news", []), ("rules", []),
        )
    }
    if server is None:
        return {"offline": True, "info": page_info, "status": None, "logs": None, "errors": None}
    # CPU, disk, and per-component errors are not reported yet; null means unavailable.
    return {
        "offline": False,
        "info": page_info,
        "status": {
            "container": {
                "status": server.container.status.upper(),
                "cpu_usage": None,
                "disk_usage": None,
                "errors": None,
            },
            "server": {"status": server.latest_status.status, "errors": None},
        },
        "logs": [entry.line or entry.message for entry in server.history],
        "errors": [entry.message for entry in server.errors],
    }


def _post_info_to_reporter(callback_url: str, server_name: str, info: dict) -> None:
    # `info` is the full server info file content, the same shape the reporter will write locally.
    try:
        response = requests.post(
            f"{callback_url.rstrip('/')}/server-info",
            json=info,
            headers={"server-password": os.getenv("CONTROL_CORE_KEY", "")},
            timeout=10,
        )
    except requests.RequestException as error:
        logger.warning(f"Reporter request failed: server={server_name} error={error!r}")
        raise HTTPException(status_code=502, detail="Could not reach the server's reporter.") from error

    if not response.ok:
        logger.warning(f"Reporter rejected server info: server={server_name} status={response.status_code}")
        raise HTTPException(status_code=502, detail="The server's reporter rejected the update.")
    logger.info(f"Posted server info to reporter: server={server_name}")


@admin_login_router.post('', status_code=200)
def server_admin_login(request: Request, login_payload: ServerAdminLoginPayload) -> ResponseObject:
    _authorize(request, login_payload.server_slug, login_payload.password, login=True)
    return {"success": True, "data": None}


@admin_server_router.get('/{server_slug}', status_code=200)
def get_server_admin(server: AuthorizedServer) -> ResponseObject:
    return {"success": True, "data": _build_page_data(server)}


@admin_server_router.patch('/{server_slug}', status_code=200)
def patch_server_admin(server: AuthorizedServer, patch: ServerAdminPATCH) -> ResponseObject:
    info = server
    logger.debug(f'PATCH server admin: server={info["server_name"]} fields={sorted(patch.model_fields_set)}')

    if find_specific_server(info['server_name']) is None:
        raise HTTPException(status_code=503, detail="The server's reporter is not reachable.")

    info.update(patch.model_dump(exclude_unset=True))
    server_name = info['server_name']
    registration = tracked_reporters.find_reporter_registration(server_name)
    callback_url = registration.callback_url if registration else None
    if not callback_url:
        logger.warning(f"No callback URL for reporter of server={server_name}")
        raise HTTPException(status_code=503, detail="The server's reporter is not reachable.")
    _post_info_to_reporter(callback_url=callback_url, server_name=server_name, info=info)
    tracked_reporters.add_tracked_server_content(
        reporter_key=registration.reporter_uid,
        server_name=server_name,
        server_content=ReporterServerContent.model_validate(info),
    )
    logger.info(f"Server metadata updated: server={server_name} fields={sorted(patch.model_fields_set)}")
    return {"success": True, "data": _build_page_data(info)}


@admin_server_router.post('/{server_slug}/{action}', status_code=200)
def server_action(server: AuthorizedServer, action: Literal["start", "restart"]) -> ResponseObject:
    # TODO: Forward to the owning reporter once reporters expose a control endpoint.
    raise HTTPException(status_code=501, detail=f"Server {action} is not available yet.")
