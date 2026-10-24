import logging
import os


def set_logger() -> None:
    # Logging
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s.%(funcName)s - %(message)s', '%Y-%m-%dT%H:%M:%SZ')
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    root = logging.getLogger()
    root.setLevel(os.getenv("LOG_LEVEL", "INFO").strip().upper())
    root.addHandler(handler)
