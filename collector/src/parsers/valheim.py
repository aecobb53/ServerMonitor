import re
import datetime

from .common import BaseParser, ServerStatus


class ValheimParser(BaseParser):
    status_pattern = {
        r"Initializing your container": {
            "status": ServerStatus.STARTING,
            "message": "Initializing Server in Container"
        },
        r"Downloading update": {
            "status": ServerStatus.UPDATING,
            "message": "Downloading update from Steam"
        },
        r"Update complete, launching Steamcmd": {
            "status": ServerStatus.UPDATING,
            "message": "Update complete, launching Steamcmd"
        },
        r"Installing mods": {
            "status": ServerStatus.INSTALLING_MODS,
            "message": "Installing Server Mods"
        },
        r"Registering lobby": {
            "status": ServerStatus.REGISTERING,
            "message": "Registering Server Lobby with Valheim Master Server"
        },
        r"Game server connected$": {
            "status": ServerStatus.ONLINE,
            "message": "Server is Running and Connected to Master Server"
        },
    }
    game_name = "Valheim"

    # def __init__(self):
    #     self.statuses = []

    # @property
    # def status(self):
    #     return self.statuses[-1] if self.statuses else None

    def parse(self, line: str):
        # Normalize ANSI-decorated log lines so patterns only evaluate message text.
        clean_line = re.sub(r"\x1b\[[0-9;]*m", "", line).strip()

        # Explicitly treat failed master-server connection attempts as REGISTERING.
        if re.search(r"Game server connected failed", clean_line):
            content = {
                "status": ServerStatus.REGISTERING,
                "message": "Retrying registration with Valheim Master Server",
                "line": clean_line,
            }
            timestamp = re.search(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)", clean_line)
            if timestamp:
                content['timestamp'] = timestamp.group(1)
            else:
                content['timestamp'] = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
            return content['status'], content

        for pattern, status_content in self.status_pattern.items():
            if re.search(pattern, clean_line):
                content = status_content.copy()
                content['line'] = clean_line
                timestamp = re.search(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)", clean_line)
                if timestamp:
                    content['timestamp'] = timestamp.group(1)
                else:
                    content['timestamp'] = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
                return content['status'], content
        return None, None
