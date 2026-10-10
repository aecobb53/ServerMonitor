import logging
from datetime import datetime, timedelta, timezone

from .models import RegisterRequest, ServerUpdatePOST, ServerUpdatePUT

REGISTERED_REPORTER_AGE_OFF_TIME_HOURS = 6
REGISTERED_SERVER_AGE_OFF_TIME_HOURS = 6

logger = logging.getLogger(__name__)

"""
Add the ability to get either the reporter object or a server object in one function instead of iterating through.
"""

class TrackedReporters:
    def __init__(self):
        self.tracked_reporters = {}

    def __contains__(self, key: str):
        if key in self.tracked_reporters:
            return True
        return any(key in reporter['servers'] for reporter in self.tracked_reporters.values())

    def add_registered_reporter(
            self,
            reporter_key: str,
            registration: RegisterRequest):
        now = datetime.now(timezone.utc)
        self.tracked_reporters[reporter_key] = {
            'registered_at': now,
            'updated_at': now,
            'registration': registration,
            'servers': {},
        }

    def add_tracked_server(
        self,
        reporter_key: str,
        report: ServerUpdatePOST,
    ):
        server_name = report.server_name
        if server_name in self:
            raise ValueError(f"Server is already tracked: {server_name}")
        now = datetime.now(timezone.utc)
        self.tracked_reporters[reporter_key]['servers'][server_name] = {
            'created_at': now,
            'updated': now,
            'details': report,
        }

    def update_registered_reporter(
        self,
        reporter_key: str,
        updated_registration: RegisterRequest,
    ):
        if updated_registration != self.tracked_reporters[reporter_key]['registration']:
            logger.info(f"Updating registration for reporter: {reporter_key}")
            self.tracked_reporters[reporter_key]['registration'] = updated_registration
        self.tracked_reporters[reporter_key]['updated_at'] = datetime.now(timezone.utc)

    def update_tracked_server(
        self,
        reporter_key: str,
        server_name: str,
        updated_report: ServerUpdatePUT,
    ):
        server = self.tracked_reporters[reporter_key]['servers'][server_name]
        state = server['details'].model_dump(mode='python')
        state.update(updated_report.model_dump(mode='python', exclude_unset=True))
        server['details'] = ServerUpdatePOST.model_validate(state)
        server['updated'] = datetime.now(timezone.utc)

    def remove_registered_reporter(self, reporter_key: str):
        del self.tracked_reporters[reporter_key]

    def remove_server(self, reporter_key: str, server_name: str):
        del self.tracked_reporters[reporter_key]['servers'][server_name]

    def age_off_stale(self):
        now = datetime.now(timezone.utc)
        for reporter_key, reporter in list(self.tracked_reporters.items()):
            if now - reporter['updated_at'] > timedelta(hours=REGISTERED_REPORTER_AGE_OFF_TIME_HOURS):
                logger.info(f"Ageing off stale registered reporter: {reporter_key}")
                del self.tracked_reporters[reporter_key]
                continue
            for server_name, server in list(reporter['servers'].items()):
                if now - server['updated'] > timedelta(hours=REGISTERED_SERVER_AGE_OFF_TIME_HOURS):
                    logger.info(f"Ageing off stale server: {server_name} from reporter: {reporter_key}")
                    del reporter['servers'][server_name]
