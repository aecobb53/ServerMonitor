import docker
import threading
from dataclasses import dataclass, field
from enum import Enum
from parsers.common import BaseParser, ServerStatus
from parsers.registry import create_parser
from config import load_config
from state import StateStore
from datetime import datetime, timezone


CONFIG = load_config()
LABEL = "server_monitor.enabled=true"
PARSER_LABEL = "server_monitor.parser"
SERVER_NAME_LABEL = "server_monitor.server_name"
HEARTBEAT_SECONDS = CONFIG.reconcile_seconds
SHARED_STORAGE = CONFIG.storage
STATE_STORE = StateStore(CONFIG.storage, CONFIG.version, CONFIG.max_history, CONFIG.max_errors)


class ContainerStatus(Enum):
    RUNNING = "running"
    STOPPED = "stopped"
    UNKNOWN = "unknown"

@dataclass
class TrackedContainer:
    container: docker.models.containers.Container
    parser: BaseParser
    state_store: StateStore

    thread: threading.Thread | None = field(init=False, default=None)

    container_status: ContainerStatus
    server_status_list: list = field(init=False, default_factory=list)
    server_name: str = "Unknown Server Name"
    closed: bool = field(init=False, default=False)
    lifecycle_lock: threading.RLock = field(init=False, default_factory=threading.RLock)

    def __post_init__(self):
        state = self.state_store.ensure(self.server_name, self.parser)
        self.server_status_list = state.get("history", []).copy()

    @property
    def server_status(self):
        if self.server_status_list:
            status = self.server_status_list[-1]['status']
            return status if isinstance(status, ServerStatus) else ServerStatus(status)
        return ServerStatus.UNKNOWN

    def start(self):
        self.container_status = ContainerStatus.RUNNING
        self.closed = False
        if self.thread is None or not self.thread.is_alive():
            self.thread = threading.Thread(
                target=self._watch_logs,
                # args=(self.container,),
                daemon=True,
            )
            self.thread.start()
        else:
            print(f"Thread for container {self.container.id} is already running.")
        self._save_current_state()

    def stop(self):
        self._close("collector")

    def _close(self, reason: str):
        with self.lifecycle_lock:
            if self.closed:
                return False
            self.closed = True
            self.container_status = ContainerStatus.STOPPED
            self.server_status_list.append({
                "status": ServerStatus.OFFLINE.value,
                "message": "Server has been shut down",
                "line": f"Container closed: {reason}",
                "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "source": reason,
                "parser_name": self.parser.name,
                "parser_version": self.parser.version,
            })
            self._save_current_state()
            return True

    def _watch_logs(self):
        save_change = False
        try:
            for line in self.container.logs(stream=True, follow=True):
                event = self.parser.parse(line.decode(errors="replace"))
                if event and (event.status is not self.server_status):
                    save_change = True
                if event:
                    self.server_status_list.append(event.to_dict())
                if save_change:
                    self._save_current_state()
                    save_change = False
        finally:
            self.thread = None
            self._close("log_stream_ended")

    def _save_current_state(self):
        state_timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        server_status_list = []
        for ssl in self.server_status_list:
            status = ssl['status']
            server_status_list.append({
                "status": status.value if isinstance(status, ServerStatus) else status,
                "message": ssl['message'],
                "line": ssl.get('line'),
                "timestamp": ssl.get('timestamp'),
                "source": ssl.get('source', 'collector'),
                "parser_name": ssl.get('parser_name'),
                "parser_version": ssl.get('parser_version'),
            })
        def update(state):
            state["game_name"] = self.parser.game_name
            state["parser"] = {"name": self.parser.name, "version": self.parser.version}
            state["container"] = {
                "id": self.container.id,
                "name": self.container.name,
                "status": self.container_status.value,
                "started_at": self.container.attrs.get("State", {}).get("StartedAt"),
            }
            if server_status_list:
                latest = server_status_list[-1]
                state["latest_status"] = latest
                state["health"] = {
                    "status": latest["status"],
                    "message": latest["message"],
                    "updated_at": latest["timestamp"],
                    "confidence": "high" if latest["status"] == ServerStatus.ONLINE.value else "medium",
                }
                state["collector"]["last_log_at"] = latest["timestamp"]
            state["history"] = server_status_list

        STATE_STORE.update(self.server_name, update)


def initialize():
    client = docker.from_env()
    tracked = {}

    for container in client.containers.list(filters={"label": LABEL}):
        add_container(container, tracked)

    return client, tracked


def add_container(container, tracked):
    labels = container.labels
    server_name = labels.get(SERVER_NAME_LABEL, "").strip()
    parser_name = labels.get(PARSER_LABEL, "").strip()
    if labels.get("server_monitor.enabled", "").lower() != "true" or not server_name or not parser_name:
        print(f"Skipping container {container.id}: required server_monitor labels are missing")
        return None
    try:
        parser = create_parser(parser_name)
    except ValueError as error:
        print(f"Skipping container {container.id}: {error}")
        return None
    existing = next((item for item in tracked.values() if item.server_name == server_name), None)
    if existing and existing.container.id != container.id:
        STATE_STORE.ensure(server_name, parser)
        STATE_STORE.record_error(server_name, {
            "type": "duplicate_server_name",
            "message": f"Container {container.id} conflicts with {existing.container.id}",
            "line": None,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "source": "collector",
            "parser_name": parser.name,
            "parser_version": parser.version,
        })
        return None
    if container.id in tracked:
        tracked[container.id].start()
        return tracked[container.id]
    tracked[container.id] = TrackedContainer(
        container=container,
        parser=parser,
        state_store=STATE_STORE,
        container_status=ContainerStatus.RUNNING,
        server_name=server_name,
    )
    tracked[container.id].start()
    return tracked[container.id]

def watch_containers(client, tracked):
    for event in client.events(
        decode=True,
        filters={
            "type": "container",
            "label": LABEL,
        },
    ):
        cid = event['Actor']["ID"]
        action = event["Action"]

        if action in ['start', 'create']:
            if cid not in tracked:
                container = client.containers.get(cid)
                add_container(container, tracked)
            else:
                tracked[cid].start()

        if action in ['die', 'stop', 'destroy', 'kill']:
            if cid in tracked:
                tracked_container = tracked[cid]
                tracked_container._close(f"docker_event:{action}")
                del tracked[cid]


def heartbeat_tracked_states(tracked):
    while True:
        if HEARTBEAT_SECONDS <= 0:
            return

        threading.Event().wait(HEARTBEAT_SECONDS)

        # Iterate over a snapshot in case event handlers modify tracked while we refresh.
        tracked_snapshot = list(tracked.values())
        for tracked_container in tracked_snapshot:
            if tracked_container.container_status == ContainerStatus.RUNNING:
                tracked_container._save_current_state()

if __name__ == "__main__":
    client, tracked = initialize()
    threading.Thread(target=heartbeat_tracked_states, args=(tracked,), daemon=True).start()
    watch_containers(client, tracked)
