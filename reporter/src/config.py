import logging
import os
from dataclasses import dataclass
from importlib.metadata import version


@dataclass(frozen=True)
class Config:
    storage: str
    content_dir: str
    version: str
    control_core_url: str
    control_core_key: str
    callback_url: str | None
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
        content_dir=os.getenv("SERVER_MONITOR_CONTENT", "/app/content/servers"),
        version=os.getenv("SERVER_MONITOR_VERSION", version("server-manager-reporter")),
        control_core_url=control_core_url.rstrip("/"),
        control_core_key=control_core_key,
        callback_url=os.getenv("SERVER_MONITOR_CALLBACK_URL"),
        retry_initial_seconds=float(os.getenv("REPORTER_RETRY_INITIAL_SECONDS", "1")),
        retry_max_seconds=float(os.getenv("REPORTER_RETRY_MAX_SECONDS", "60")),
        log_level=os.getenv("LOG_LEVEL", "INFO").strip().upper(),
    )
