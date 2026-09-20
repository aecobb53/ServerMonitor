import json
import os
import re
import threading
import uuid
from datetime import datetime, timezone
from typing import Callable


STATE_FILE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$")


def now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class StateStore:
    def __init__(self, root: str, collector_version: str, max_history: int, max_errors: int):
        self.directory = os.path.join(root, "servers")
        self.collector_version = collector_version
        self.max_history = max_history
        self.max_errors = max_errors
        self._files: dict[str, str] = {}
        self._locks: dict[str, threading.RLock] = {}
        os.makedirs(self.directory, exist_ok=True)
        self._load_files()

    def _load_files(self):
        for filename in os.listdir(self.directory):
            if not STATE_FILE.fullmatch(filename):
                continue
            path = os.path.join(self.directory, filename)
            try:
                with open(path) as file:
                    state = json.load(file)
                name = state["server_name"]
                if isinstance(name, str) and name:
                    self._files[name] = path
                    self._locks[name] = threading.RLock()
            except (OSError, TypeError, ValueError, KeyError):
                os.replace(path, f"{path}.invalid")

    def _lock(self, server_name: str) -> threading.RLock:
        return self._locks.setdefault(server_name, threading.RLock())

    def ensure(self, server_name: str, parser) -> dict:
        with self._lock(server_name):
            path = self._files.get(server_name)
            if path:
                with open(path) as file:
                    state = json.load(file)
                previous = state.get("parser", {})
                if previous.get("name") != parser.name or previous.get("version") != parser.version:
                    state.setdefault("history", []).append({
                        "status": state.get("health", {}).get("status", "UNKNOWN"),
                        "message": f"Parser changed to {parser.name} {parser.version}",
                        "line": None,
                        "timestamp": now(),
                        "source": "collector",
                        "parser_name": parser.name,
                        "parser_version": parser.version,
                    })
                state["parser"] = {"name": parser.name, "version": parser.version}
                state["game_name"] = parser.game_name
                self._write(path, state)
                return state

            state = {
                "schema_version": 1,
                "server_name": server_name,
                "game_name": parser.game_name,
                "parser": {"name": parser.name, "version": parser.version},
                "container": {"id": None, "name": None, "status": "unknown", "started_at": None},
                "health": {"status": "UNKNOWN", "message": "No server status observed", "updated_at": now(), "confidence": "low"},
                "latest_status": None,
                "history": [],
                "errors": [],
                "collector": {
                    "collector_version": self.collector_version,
                    "updated_at": now(),
                    "last_reconciled_at": None,
                    "last_log_at": None,
                    "history_dropped": 0,
                    "errors_dropped": 0,
                },
            }
            path = os.path.join(self.directory, f"{uuid.uuid4()}.json")
            self._files[server_name] = path
            self._write(path, state)
            return state

    def update(self, server_name: str, updater: Callable[[dict], None]):
        with self._lock(server_name):
            path = self._files[server_name]
            with open(path) as file:
                state = json.load(file)
            updater(state)
            history = state.setdefault("history", [])
            errors = state.setdefault("errors", [])
            collector = state.setdefault("collector", {})
            if len(history) > self.max_history:
                collector["history_dropped"] = collector.get("history_dropped", 0) + len(history) - self.max_history
                del history[:-self.max_history]
            if len(errors) > self.max_errors:
                collector["errors_dropped"] = collector.get("errors_dropped", 0) + len(errors) - self.max_errors
                del errors[:-self.max_errors]
            collector["collector_version"] = self.collector_version
            collector["updated_at"] = now()
            self._write(path, state)

    def record_error(self, server_name: str, error: dict):
        self.update(server_name, lambda state: state.setdefault("errors", []).append(error))

    def _write(self, path: str, state: dict):
        temporary = f"{path}.{uuid.uuid4().hex}.tmp"
        try:
            with open(temporary, "w") as file:
                json.dump(state, file, indent=2)
                file.flush()
                os.fsync(file.fileno())
            os.replace(temporary, path)
        finally:
            if os.path.exists(temporary):
                os.remove(temporary)