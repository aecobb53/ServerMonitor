from datetime import datetime, timedelta
from .models import RegisterRequest


class TrackedReporters:
    def __init__(self):
        self.registered_reporters = {}  # {key: datetime} to know when to age off
        self.tracked_servers = {}

    def __contains__(self, registration):
        return registration in (r['registration'] for r in self.registered_reporters.values())

    def add_registered_reporter(
            self,
            reporter_key: str,
            registration: RegisterRequest):
        self.registered_reporters[reporter_key] = {
            'updated': datetime.now(),
            'registration': registration,
        }

    def age_off_reporters(self):
        for key, registration in self.registered_reporters.items():
            if datetime.now() - registration['updated'] > timedelta(hours=6):
                del self.registered_reporters[key]
                # Break after deleting to avoid RuntimeError due to changing dict size during iteration
                # Also this allows for staggering re-registration
                del self.tracked_servers[key]
                break

    def add_tracked_server(
        self,
        reporter_key: str,
        report):
        self.tracked_servers[reporter_key] = report

    def update_tracked_server(
        self,
        reporter_key: str,
        updated_report):
        for key, value in updated_report.items():
            self.tracked_servers[reporter_key][key] = value

    def delete_tracked_server(self, reporter_key: str):
        del self.tracked_servers[reporter_key]





