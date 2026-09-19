import logging


def set_logger() -> None:
    # Logging
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s.%(funcName)s - %(message)s', '%Y-%m-%dT%H:%M:%SZ')
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    root = logging.getLogger()
    root.setLevel(logging.DEBUG)
    root.addHandler(handler)
