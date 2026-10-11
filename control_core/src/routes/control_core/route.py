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
    logger.debug(f"Register request: reporter={reporter_key} version={registration.version}")

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

@router.get('/log/registrations', status_code=200)
def log_registrations(
    # server_password: str | None = Header(default=None),
    ):
    print('THIS FUCKING FUNCTION WAS RUN')
    logger.debug('')
    logger.debug('')
    logger.debug('')
    logger.debug('Logging all registered reporters:')
    for reporter_key, reporter in tracked_reporters.tracked_reporters.items():
        logger.debug('')
        logger.debug('')
        registration = reporter['registration']
        logger.debug(f"Reporter: {reporter_key}, Registration: {registration.model_dump()}")
        logger.debug(f"  Callback URL: {registration.callback_url}")
        for server_name, server in reporter['servers'].items():
            details = server['details']
            logger.debug(f"  Tracked Server: {server_name}, Game: {details.game_name}, Last Updated: {server['updated']}")
    logger.debug('')
    logger.debug('')
    logger.debug('')
    logger.debug('DONE')
    return {
        "success": True,
        "data": "Received"
    }
