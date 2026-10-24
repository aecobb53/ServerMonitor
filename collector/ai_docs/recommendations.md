# Collector Recommendations

This document describes a lightweight file-based lifecycle for the collector. It is intentionally limited to the `collector` directory and is designed for friends to run with different game servers.

## Goals

- Read logs from labeled Docker containers.
- Keep one current state file for each running container.
- Preserve a history of containers that have stopped.
- Recover cleanly after collector restarts.
- Keep the implementation easy to inspect, deploy, and troubleshoot.

## Storage Layout

Use separate directories under the shared storage mount:

```text
/app/storage/
  active/
    <container-id>.json
  history/
    <container-id>-<session-id>.json
```

`active` contains only containers currently being tracked as running. `history` contains closed container sessions and is never rewritten as current state.

A container ID is suitable for identifying one Docker container. If the same logical game server may be recreated frequently, also store a stable server ID in a Docker label, such as `server_monitor.server_id`.

## Container Lifecycle

### First discovery

When a labeled running container is first discovered:

1. Select the parser from its labels or another explicit configuration value.
2. Create an active state file if one does not already exist.
3. Record `first_seen`, `last_seen`, and `container_status: running`.
4. Start one log-watching worker for the container.

Creating the file should be safe to repeat. Repeated Docker events must not create duplicate workers or reset an existing history.

### Normal updates

Log parsing should append meaningful status transitions to the active file. Heartbeats may update `last_seen` and the collector timestamp, but should not create duplicate status entries.

Keep only a bounded number of recent status entries in the active file, for example the most recent 50. On shutdown, the complete session history can be written to the history file if retaining every transition is required.

### Container shutdown

Stopping must be idempotent. The first shutdown path should:

1. Set `container_status` to `stopped`.
2. Set `closed_at` and a `close_reason` such as `docker_event`, `log_stream_ended`, or `startup_reconciliation`.
3. Append one OFFLINE status entry.
4. Write the final state atomically.
5. Move the state file from `active` to `history`.
6. Remove the container from the in-memory tracking map.

Later shutdown events or a log-thread cleanup path should detect that the container is already closed and do nothing. This prevents duplicate OFFLINE entries and duplicate history files.

## Startup Reconciliation

Startup should establish state from Docker and the filesystem together:

1. List all currently running labeled containers from Docker.
2. List state files in `active`.
3. For each active file whose container ID is not currently running, close it once with `close_reason: startup_reconciliation` and move it to `history`.
4. For each running Docker container without an active file, create a new active file with `close_reason` absent and `container_status: running`.
5. Start exactly one watcher for each running container.

This makes restarts safe. A previously closed file in `history` should never be treated as an active record or receive another shutdown entry.

Only parse files matching the collector's expected state-file name or directory. Do not attempt to load arbitrary files found in the storage mount.

## Suggested State Shape

```json
{
  "container_id": "...",
  "server_id": "...",
  "server_name": "...",
  "game_name": "Valheim",
  "container_status": "running",
  "first_seen": "2026-09-20T12:00:00Z",
  "last_seen": "2026-09-20T12:05:00Z",
  "closed_at": null,
  "close_reason": null,
  "revision": 12,
  "server_status_list": []
}
```

Each status entry should include `status`, `message`, `line`, `timestamp`, and optionally `source`. Useful source values are `log_parser`, `docker_event`, and `startup_reconciliation`.

## Concurrency and File Safety

The log watcher, Docker event loop, and heartbeat worker can all write the same state file. Use one lock per container ID around state mutation and persistence.

Write state atomically:

1. Serialize to a temporary file in the same directory.
2. Flush and close it.
3. Replace the target file with `os.replace`.

This prevents readers from seeing a partially written JSON document. The revision field can help diagnose unexpected write ordering.

## Parser Extensibility

The parser interface is a good starting point. Avoid hardcoding `ValheimParser` in every container creation path as more games are added. Prefer a small registry keyed by a Docker label, for example:

```text
server_monitor.parser=valheim
```

The registry can map parser names to parser classes. Unknown parser names should produce an explicit state or log error rather than silently assigning the Valheim parser.

Each parser should return either no event or a normalized status event with the same fields. Timestamp extraction and ANSI cleanup can remain shared utilities if multiple parsers need them.

## Main Risks in the Current Runner

- Startup reconciliation appends OFFLINE on every restart for old files.
- Docker stop events and log-stream cleanup can both append OFFLINE.
- Stopped containers remain in the in-memory tracking map.
- Heartbeat, event, and log threads can write concurrently.
- The status list grows without a bound.
- Parser selection is hardcoded to Valheim.
- Every file in the storage directory is treated as a state file during reconciliation.

The first implementation pass should focus on idempotent close behavior, active/history directories, and startup reconciliation. Those changes address lingering records while keeping the file-based communication model intact.
