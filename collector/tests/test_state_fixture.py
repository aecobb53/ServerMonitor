"""Verifies StateStore + a real parser produce the state-file shape control_core/reporter expect,
and writes a deterministic fixture other test suites (reporter/control_core integration) can consume.
"""
import json
from pathlib import Path

from parsers.common import ServerStatus
from parsers.registry import create_parser
from state import StateStore

FIXTURE_OUT = Path(__file__).resolve().parents[2] / "shared" / "fixtures" / "servers" / "generated_hellheim_state.json"

# Raw log lines lifted from shared/states/servers/656fa368-7d9e-4de1-8cda-8311c7b38a10.json
# so the parser derives the same timestamps deterministically from line content.
LOG_LINES = [
    "2026-09-19T20:03:33.525396054Z 2026-09-19T20:03:33.525166Z  INFO odin::commands::logs: [valheim_server.log]: 09/19/2026 20:03:33: Registering lobby",
    "2026-09-22T22:43:21.937448000Z 2026-09-22T22:43:21.937168Z  INFO odin::commands::logs: [valheim_server.log]: 09/22/2026 22:43:21: Game server connected",
]

FIXED_NOW = "2026-09-23T20:48:01.204138Z"


def test_ensure_creates_json_serializable_state(tmp_path):
    store = StateStore(str(tmp_path), collector_version="0.1.0", max_history=500, max_errors=100)
    parser = create_parser("valheim")

    state = store.ensure("Hellheim", parser)

    assert state["record_datetime"].endswith("Z")
    assert json.loads(Path(store._files["Hellheim"]).read_text())["server_name"] == "Hellheim"


def test_generates_hellheim_state_fixture(tmp_path, monkeypatch):
    import state as state_module

    monkeypatch.setattr(state_module, "now", lambda: FIXED_NOW)

    store = StateStore(str(tmp_path), collector_version="0.1.0", max_history=500, max_errors=100)
    parser = create_parser("valheim")

    server_name = "Hellheim"
    store.ensure(server_name, parser)
    path = Path(store._files[server_name])

    events = [parser.parse(line) for line in LOG_LINES]
    assert all(events), "expected every sample log line to produce a status event"

    history = [event.to_dict() for event in events]

    def apply_events(state):
        state["game_name"] = parser.game_name
        state["container"] = {
            "id": "10c531ace5e66d2b9bb909cf17981cb242cc9320e97baadccd88d79b76ea8bec",
            "name": "friendly-neighborhood-valheim-server-hellheim-1",
            "status": "running",
            "started_at": "2026-09-19T19:14:09.356841849Z",
        }
        latest = history[-1]
        state["latest_status"] = latest
        state["health"] = {
            "status": latest["status"],
            "message": latest["message"],
            "updated_at": latest["timestamp"],
            "confidence": "high" if latest["status"] == ServerStatus.ONLINE.value else "medium",
        }
        state["history"] = history
        state["collector"]["last_log_at"] = latest["timestamp"]

    store.update(server_name, apply_events)

    with open(path) as file:
        generated = json.load(file)

    # Shape/type assertions -- this is what reporter/control_core actually contract on.
    assert generated["schema_version"] == 1
    assert isinstance(generated["server_name"], str)
    assert isinstance(generated["game_name"], str)
    assert generated["parser"] == {"name": "valheim", "version": "1.0.0"}
    assert set(generated["container"]) == {"id", "name", "status", "started_at"}
    assert generated["health"]["status"] in {status.value for status in ServerStatus}
    assert isinstance(generated["history"], list) and len(generated["history"]) == 2
    for entry in generated["history"]:
        assert set(entry) == {"status", "message", "line", "timestamp", "source", "parser_name", "parser_version"}
    assert generated["latest_status"]["status"] == ServerStatus.ONLINE.value
    assert generated["collector"]["collector_version"] == "0.1.0"

    FIXTURE_OUT.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE_OUT.write_text(json.dumps(generated, indent=2) + "\n")
