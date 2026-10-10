import logging
import os
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
        self.max_history = int(os.getenv("CONTROL_CORE_MAX_HISTORY", 500))
        self.max_errors = int(os.getenv("CONTROL_CORE_MAX_ERRORS", 100))

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
        self.tracked_reporters[reporter_key]['updated_at'] = now

    def has_tracked_server(self, reporter_key: str, server_name: str) -> bool:
        return server_name in self.tracked_reporters.get(reporter_key, {}).get('servers', {})

    def find_server(self, server_name: str) -> ServerUpdatePOST | None:
        for reporter in self.tracked_reporters.values():
            server = reporter['servers'].get(server_name)
            if server:
                return server['details']
        return None

    def servers_by_game(self) -> dict[str, list[ServerUpdatePOST]]:
        games: dict[str, list[ServerUpdatePOST]] = {}
        for reporter in self.tracked_reporters.values():
            for server in reporter['servers'].values():
                details = server['details']
                games.setdefault(details.game_name, []).append(details)
        return games

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
        update = updated_report.model_dump(mode='python', exclude_unset=True)
        for key in ('history', 'errors'):
            if key in update:
                state[key].extend(update.pop(key))
        if len(state['history']) > self.max_history:
            del state['history'][:-self.max_history]
        if len(state['errors']) > self.max_errors:
            del state['errors'][:-self.max_errors]
        state.update(update)
        server['details'] = ServerUpdatePOST.model_validate(state)
        now = datetime.now(timezone.utc)
        server['updated'] = now
        self.tracked_reporters[reporter_key]['updated_at'] = now

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


tracked_reporters = TrackedReporters()


