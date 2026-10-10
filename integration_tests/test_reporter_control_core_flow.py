import asyncio
import json
import socket
import sys
import threading
import time
from copy import deepcopy
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request


ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "reporter"), str(ROOT / "control_core" / "src")]

from routes.control_core.route import TEMP_TRACKED_REPORTERS, router, tracked_reporters
from src.config import Config
from src.reporter import Reporter


def test_reporter_registers_posts_and_patches_collector_state(tmp_path):
    requests = []
    app = FastAPI()

    @app.middleware("http")
    async def capture_request(request: Request, call_next):
        body = await request.body()
        captured_request = {
            "method": request.method,
            "path": request.url.path,
            "headers": dict(request.headers),
            "body": json.loads(body) if body else None,
        }
        response = await call_next(request)
        captured_request["status_code"] = response.status_code
        requests.append(captured_request)
        return response

    app.include_router(router)
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]

    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning"))
    thread = threading.Thread(target=server.run, daemon=True)
    tracked_reporters.tracked_reporters.clear()
    original_limits = tracked_reporters.max_history, tracked_reporters.max_errors
    tracked_reporters.max_history = 2
    tracked_reporters.max_errors = 1
    TEMP_TRACKED_REPORTERS.clear()
    thread.start()
    deadline = time.monotonic() + 5
    while not server.started and time.monotonic() < deadline:
        threading.Event().wait(0.01)
    assert server.started

    try:
        fixture = json.loads((ROOT / "shared/fixtures/servers/generated_hellheim_state.json").read_text())
        state_path = tmp_path / "servers" / "656fa368-7d9e-4de1-8cda-8311c7b38a10.json"
        state_path.parent.mkdir()
        state_path.write_text(json.dumps(fixture))
        reporter = Reporter(Config(
            storage=str(tmp_path),
            version="0.1.0",
            control_core_url=f"http://127.0.0.1:{port}",
            control_core_key="unused",
            callback_url=None,
            retry_initial_seconds=0,
            retry_max_seconds=0,
            log_level="WARNING",
        ))

        asyncio.run(reporter.send_file(state_path, "servers/" + state_path.name))

        updated = deepcopy(fixture)
        updated["health"]["message"] = "Integration test update"
        updated["history"].append({
            **fixture["latest_status"],
            "message": "Integration history update",
            "timestamp": "2026-09-23T20:48:02.204138Z",
        })
        updated["errors"].append({
            "type": "integration_test",
            "message": "Integration error update",
            "line": None,
            "timestamp": "2026-09-23T20:48:02.204138Z",
            "source": "collector",
            "parser_name": "valheim",
            "parser_version": "1.0.0",
        })
        state_path.write_text(json.dumps(updated))
        asyncio.run(reporter.send_file(state_path, "servers/" + state_path.name))

        assert [(request["method"], request["path"]) for request in requests] == [
            ("POST", "/control-core/files"),
            ("POST", "/control-core/register"),
            ("POST", "/control-core/files"),
            ("PATCH", "/control-core/files"),
        ]
        assert [request["status_code"] for request in requests] == [404, 201, 200, 200]
        assert requests[0]["body"] == fixture
        assert requests[1]["body"] == {
            "reporter_uid": reporter.uid,
            "version": "0.1.0",
            "callback_url": None,
        }
        assert requests[2]["body"] == fixture
        assert all(request["headers"]["reporter-key"] == reporter.uid for request in requests)
        assert requests[1]["headers"]["server-password"] == "Example"
        assert set(requests[3]["body"]) == {
            "schema_version", "server_name", "game_name", "record_datetime", "health", "history", "errors",
        }
        assert requests[3]["body"]["health"] == updated["health"]
        assert requests[3]["body"]["history"] == [updated["history"][-1]]
        assert requests[3]["body"]["errors"] == updated["errors"]

        stored = tracked_reporters.tracked_reporters[reporter.uid]["servers"]["Hellheim"]["details"]
        assert stored.health.message == "Integration test update"
        assert stored.history == updated["history"][-2:]
        assert stored.errors == updated["errors"]
    finally:
        server.should_exit = True
        thread.join(timeout=5)
        tracked_reporters.tracked_reporters.clear()
        tracked_reporters.max_history, tracked_reporters.max_errors = original_limits
        TEMP_TRACKED_REPORTERS.clear()


def test_reporter_handles_unavailable_control_core(tmp_path, caplog):
    fixture = json.loads((ROOT / "shared/fixtures/servers/generated_hellheim_state.json").read_text())
    state_path = tmp_path / "servers" / "656fa368-7d9e-4de1-8cda-8311c7b38a10.json"
    state_path.parent.mkdir()
    state_path.write_text(json.dumps(fixture))
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]

    reporter = Reporter(Config(
        storage=str(tmp_path),
        version="0.1.0",
        control_core_url=f"http://127.0.0.1:{port}",
        control_core_key="unused",
        callback_url=None,
        retry_initial_seconds=0,
        retry_max_seconds=0,
        log_level="WARNING",
    ))

    asyncio.run(reporter.send_file(state_path, "servers/" + state_path.name))

    assert state_path.name not in reporter.previous_data_object
    assert "State upload failed" in caplog.text


def test_reporter_history_diff_stops_at_last_sent_timestamp(tmp_path):
    reporter = Reporter(Config(
        storage=str(tmp_path),
        version="0.1.0",
        control_core_url="http://127.0.0.1:1",
        control_core_key="unused",
        callback_url=None,
        retry_initial_seconds=0,
        retry_max_seconds=0,
        log_level="WARNING",
    ))
    previous = {
        "schema_version": 1,
        "server_name": "Hellheim",
        "game_name": "Valheim",
        "record_datetime": "2026-09-23T20:48:01Z",
        "history": [{"timestamp": "2026-09-23T20:48:01Z", "message": "sent"}],
        "errors": [],
    }
    reporter.previous_data_object["server.json"] = previous
    current = deepcopy(previous)
    current["history"][0]["message"] = "changed locally"
    current["history"].append({"timestamp": "2026-09-23T20:48:02Z", "message": "new"})

    diff = reporter.construct_payload_diff(current, "server.json")

    assert diff["history"] == [current["history"][-1]]
