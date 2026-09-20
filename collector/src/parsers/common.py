from enum import Enum
from dataclasses import dataclass


class ServerStatus(Enum):
    STARTING = 'STARTING'
    UPDATING = 'UPDATING'
    ONLINE = 'ONLINE'
    OFFLINE = 'OFFLINE'
    UNKNOWN = 'UNKNOWN'
    ERROR = 'ERROR'


@dataclass
class StatusEvent:
    status: ServerStatus
    message: str
    line: str | None = None
    timestamp: str | None = None
    source: str = "log_parser"
    parser_version: str | None = None


@dataclass
class AnalysisResult:
    status: ServerStatus
    message: str
    confidence: str = "low"
    evidence_at: str | None = None
    event: StatusEvent | None = None


class BaseParser:
    game_name = "Unknown Game"
    name = "unknown"
    version = "0.0.0"

    def parse(self, line: str):
        raise NotImplementedError("Subclasses should implement this method.")

    def analyze(self, lines: list[str]) -> AnalysisResult:
        raise NotImplementedError("Subclasses should implement this method.")
