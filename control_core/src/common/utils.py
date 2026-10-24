import json
import os
from datetime import datetime, timezone
from pathlib import Path

from common.exceptions import ServerNotFoundError
from routes.control_core.handler import tracked_reporters

import logging
logger = logging.getLogger(__name__)


DATA_DIR = Path("/app/storage")
CONTENT_DIR = Path("/app/content")
SERVERS_DIR = CONTENT_DIR / "servers"
REQUESTS_DIR = CONTENT_DIR / "requests"
EVENTS_DIR = CONTENT_DIR / "events"
POLLS_DIR = CONTENT_DIR / "polls"
POLL_RESPONSES_DIR = CONTENT_DIR / "poll_responses"
IMAGES_DIR = Path("/app/images")


def parse_timestamp(timestamp: str) -> datetime:
    try:
        return datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError:
        return datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")

def find_servers():
    return {
        server.server_name: server
        for servers in tracked_reporters.servers_by_game().values()
        for server in servers
    }

def find_game_servers():
    return tracked_reporters.servers_by_game()

def find_specific_server(server_name):
    return tracked_reporters.find_server(server_name)

def find_game_info(server_name: str) -> dict:
    content = tracked_reporters.find_server_content(server_name)
    if content is None:
        # Content can legitimately be missing for a while (reporter hasn't sent it yet).
        logger.info(f"No server content yet for {server_name}")
        raise ServerNotFoundError(f"The server named {server_name} was not found")
    return content.model_dump()

# def find_game_info(server_name: str):
#     for server in os.listdir(SERVERS_DIR):
#         with open(SERVERS_DIR / server) as sf:
#             server_info = json.load(sf)
#             if server_info['server_name'] == server_name:
#                 return server_info
#     else:
#         raise ServerNotFoundError(f"The server named {server_name} was not found")