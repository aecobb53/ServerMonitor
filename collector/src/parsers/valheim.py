import re
import datetime

from .common import AnalysisResult, BaseParser, ServerStatus, StatusEvent


class ValheimParser(BaseParser):
    name = "valheim"
    version = "1.0.0"
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
            "status": ServerStatus.UPDATING,
            "message": "Installing Server Mods"
        },
        r"Registering lobby": {
            "status": ServerStatus.UPDATING,
            "message": "Registering Server Lobby with Valheim Master Server"
        },
        r"Game server connected$": {
            "status": ServerStatus.ONLINE,
            "message": "Server is Running and Connected to Master Server"
        },
    }
    game_name = "Valheim"

    def parse(self, line: str):
        clean_line = re.sub(r"\x1b\[[0-9;]*m", "", line).strip()
        timestamp = re.search(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+", clean_line)
        event_timestamp = timestamp.group(1) if timestamp else datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

        if re.search(r"Game server connected failed", clean_line):
            return StatusEvent(
                status=ServerStatus.UPDATING,
                message="Retrying registration with Valheim Master Server",
                line=clean_line,
                timestamp=event_timestamp,
                parser_name=self.name,
                parser_version=self.version,
            )

        for pattern, status_content in self.status_pattern.items():
            if re.search(pattern, clean_line):
                return StatusEvent(
                    status=status_content["status"],
                    message=status_content["message"],
                    line=clean_line,
                    timestamp=event_timestamp,
                    parser_name=self.name,
                    parser_version=self.version,
                )
        return None

    def analyze(self, lines: list[str]) -> AnalysisResult:
        events = [event for line in lines if (event := self.parse(line))]
        if not events:
            return AnalysisResult(
                status=ServerStatus.UNKNOWN,
                message="No recognized server status in recent logs",
            )

        event = events[-1]
        confidence = "high" if event.status is ServerStatus.ONLINE else "medium"
        return AnalysisResult(
            status=event.status,
            message=event.message,
            confidence=confidence,
            evidence_at=event.timestamp,
            event=event,
        )
