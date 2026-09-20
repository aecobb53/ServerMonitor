import os
from dataclasses import dataclass
from importlib.metadata import PackageNotFoundError, version


def _project_version() -> str:
    try:
        return version("server-manager-agent")
    except PackageNotFoundError:
        return "0.1.0"


def _int(name: str, default: int, minimum: int = 0) -> int:
    value = int(os.getenv(name, str(default)))
    if value < minimum:
        raise ValueError(f"{name} must be at least {minimum}")
    return value


@dataclass(frozen=True)
class Config:
    storage: str
    version: str
    reconcile_seconds: int
    log_tail: int
    max_history: int
    max_errors: int
    log_level: str


def load_config() -> Config:
    return Config(
        storage=os.getenv("SERVER_MONITOR_STORAGE", "/app/storage"),
        version=os.getenv("SERVER_MONITOR_VERSION", _project_version()),
        reconcile_seconds=_int("SERVER_MONITOR_RECONCILE_SECONDS", 60, 1),
        log_tail=_int("SERVER_MONITOR_LOG_TAIL", 10000),
        max_history=_int("SERVER_MONITOR_MAX_HISTORY", 500),
        max_errors=_int("SERVER_MONITOR_MAX_ERRORS", 100),
        log_level=os.getenv("SERVER_MONITOR_LOG_LEVEL", "INFO").upper(),
    )