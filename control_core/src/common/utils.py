import os
import json

from datetime import datetime, timezone
from pathlib import Path

from common.exceptions import ServerNotFoundError

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
    servers = {}

    for file in DATA_DIR.glob("*.json"):
        with open(file) as f:
            server_info = json.load(f)
            server_name = server_info['server_name']
            if server_name not in servers:
                servers[server_name] = []
            servers[server_name].append(server_info)

    sorted_servers = {
        key: sorted(list_of_dicts, key=lambda x: parse_timestamp(x["timestamp"]))
        for key, list_of_dicts in servers.items()
    }
    return sorted_servers

def find_game_servers():
    servers = find_servers()
    games = {}
    for server_list in servers.values():
        if not len(server_list):
            continue
        latest_server = server_list[-1]
        status_list = latest_server.get('server_status_list')
        if status_list:
            latest_server['latest_status'] = status_list[-1]
        else:
            latest_server['latest_status'] = {}
        game_name = latest_server.get('game_name', 'Unknown')
        if game_name not in games:
            games[game_name] = []
        games[game_name].append(latest_server)
    return games

def find_specific_server(server_name):
    servers = find_servers()
    for server_list in servers.values():
        if not server_list:
            continue
        latest_server = server_list[-1]
        if latest_server['server_name'] == server_name:
            latest_server['latest_status'] = latest_server.get('server_status_list', [{}])[-1]
            return latest_server
    return None

def find_game_info(server_name: str):
    for server in os.listdir(SERVERS_DIR):
        with open(SERVERS_DIR / server) as sf:
            server_info = json.load(sf)
            if server_info['server_name'] == server_name:
                return server_info
    else:
        raise ServerNotFoundError(f"The server named {server_name} was not found")
