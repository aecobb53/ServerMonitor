import asyncio
import logging
import os
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

from fastapi import APIRouter, HTTPException, Header, Request

from .models import (
    ServerUpdatePOST,
    ServerUpdatePUT,
    RegisterRequest,
    ReporterServerContent,
)
from .handler import tracked_reporters

AGE_OFF_INTERVAL_SECONDS = float(os.getenv("CONTROL_CORE_AGE_OFF_INTERVAL_SECONDS", 6 * 60 * 60))


async def _age_off_loop():
    while True:
        await asyncio.sleep(AGE_OFF_INTERVAL_SECONDS)
        try:
            tracked_reporters.age_off_stale()
        except Exception:
            logger.exception("Age off of stale reporters failed")


@asynccontextmanager
async def _router_lifespan(app):
    task = asyncio.create_task(_age_off_loop())
    try:
        yield
    finally:
        task.cancel()


router = APIRouter(
    prefix='/control-core',
    tags=['control-core'],
    lifespan=_router_lifespan,
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
    request: Request,
    registration: RegisterRequest,
    server_password: str | None = Header(default=None),
    reporter_key: str = Header(..., ),
    ):
    _require_reporter_password(server_password)
    logger.debug(f"Register request: reporter={reporter_key} version={registration.version}")
    # client is the direct peer; forwarded headers hold the original caller.
    logger.debug(
        f"Register origin: peer={request.client.host if request.client else 'unknown'} "
        f"x_forwarded_for={request.headers.get('x-forwarded-for')} "
        f"x_real_ip={request.headers.get('x-real-ip')} "
        f"user_agent={request.headers.get('user-agent')} "
        f"callback_url={registration.callback_url}"
    )

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
    logger.debug(f"File POST: reporter={reporter_key} server={report.server_name}")
    if reporter_key not in tracked_reporters:
        logger.info(f"Reporter {reporter_key} is not registered; rejecting file upload")
        raise HTTPException(status_code=404, detail="Server not found")

    try:
        tracked_reporters.add_tracked_server(
            reporter_key=reporter_key,
            report=report,
        )
    except ValueError as error:
        logger.warning(f"Rejecting file POST: reporter={reporter_key} {error}")
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
    print(f"PATCH RUN")
    print(f"REPORT: {report}")
    print(f"REPORTER KEY: {reporter_key}")
    print(f"PATCH RUN")
    _require_reporter_password(server_password)
    logger.debug(f"File PATCH: reporter={reporter_key} server={report.server_name}")
    if reporter_key not in tracked_reporters:
        logger.info(f"Reporter {reporter_key} is not registered; rejecting file upload")
        raise HTTPException(status_code=404, detail="Server not found")

    if not tracked_reporters.has_tracked_server(reporter_key, report.server_name):
        logger.info(f"Server {report.server_name} is not tracked for reporter {reporter_key}; rejecting patch")
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

@router.post('/server-content', status_code=200)
def receive_server_content(
    report: ReporterServerContent,
    reporter_key: str = Header(..., ),
    server_password: str | None = Header(default=None),
    ):
    _require_reporter_password(server_password)
    logger.debug(f"Server Content POST: reporter={reporter_key} server={report.server_name}")
    if reporter_key not in tracked_reporters:
        logger.info(f"Reporter {reporter_key} is not registered; rejecting file upload")
        raise HTTPException(status_code=404, detail="Server not found")

    try:
        tracked_reporters.add_tracked_server_content(
            reporter_key=reporter_key,
            server_name=report.server_name,
            server_content=report,
        )
    except ValueError as error:
        # The state file POST must come first so the server exists.
        logger.info(f"Rejecting server content: reporter={reporter_key} {error}")
        raise HTTPException(status_code=404, detail="Server not found") from error

    return {
        "success": True,
        "data": "Received"
    }

@router.get('/log/registrations', status_code=200)
def log_registrations(
    # server_password: str | None = Header(default=None),
    ):
    now = datetime.now(timezone.utc)
    log_list = []
    log_list.append('')
    log_list.append('')
    log_list.append(f'Current server time: {now}')
    log_list.append('Logging all registered reporters:')
    for reporter_key, reporter in tracked_reporters.tracked_reporters.items():
        log_list.append('')
        log_list.append('')
        registration = reporter['registration']
        log_list.append(f"Reporter: {reporter_key}, Registration: {registration.model_dump()}")
        log_list.append(f"  Callback URL: {registration.callback_url}")
        for server_name, server in reporter['servers'].items():
            details = server['details']
            log_list.append(f"  Tracked Server: {server_name}, Game: {details.game_name}, Last Updated: {server['updated']}")
    log_list.append('')
    log_list.append('')
    log_list.append('')
    log_list.append('DONE')
    logger.debug('\n'.join(log_list))
    return {
        "success": True,
        "data": "Received"
    }
