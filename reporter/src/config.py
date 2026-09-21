import os
from dataclasses import dataclass
from importlib.metadata import PackageNotFoundError, version


def _project_version() -> str:
    try:
        return version("server-manager-reporter")
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
    control_core_url: str
    control_core_key: str
    callback_url: str | None
    reconcile_seconds: int
    retry_initial_seconds: float
    retry_max_seconds: float
    log_level: str


def load_config() -> Config:
    control_core_url = os.getenv("CONTROL_CORE_URL")
    control_core_key = os.getenv("CONTROL_CORE_KEY")

    if not control_core_url:
        raise ValueError("CONTROL_CORE_URL is required")

    if not control_core_key:
        raise ValueError("CONTROL_CORE_KEY is required")

    return Config(
        storage=os.getenv("SERVER_MONITOR_STORAGE", "/app/storage"),
        version=os.getenv("SERVER_MONITOR_VERSION", _project_version()),
        control_core_url=control_core_url.rstrip("/"),
        control_core_key=control_core_key,
        callback_url=os.getenv("SERVER_MONITOR_CALLBACK_URL"),
        reconcile_seconds=_int(
            "SERVER_MONITOR_RECONCILE_SECONDS",
            60,
            1,
        ),
        retry_initial_seconds=float(os.getenv("REPORTER_RETRY_INITIAL_SECONDS", "1")),
        retry_max_seconds=float(os.getenv("REPORTER_RETRY_MAX_SECONDS", "60")),
        log_level=os.getenv("SERVER_MONITOR_LOG_LEVEL", "INFO").upper(),
    )
