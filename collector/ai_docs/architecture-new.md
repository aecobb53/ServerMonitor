# Collector Architecture

## Purpose

The Collector monitors labeled Docker containers, derives server state from their logs, and publishes one JSON state file per logical server. It has no network API and communicates only through the shared storage volume.

A logical server is identified by the value of `server_monitor.server_name`. Container IDs are runtime details and may change when a container is recreated.

## Container Labels

A container is tracked only when all required labels are present and valid:

```yaml
server_monitor.enabled: "true"
server_monitor.parser: "valheim"
server_monitor.server_name: "Hellheim"
```

Required labels:

- `server_monitor.enabled`: Must equal `true`.
- `server_monitor.parser`: Selects the registered log parser.
- `server_monitor.server_name`: Logical server name and downstream identity.

Containers with missing, invalid, or unknown labels are not tracked. The Collector should log the reason when it skips one.

`server_monitor.server_name` must be unique among currently tracked containers. If two containers claim the same name, the Collector must not silently allow them to overwrite each other. It should record an error and choose a deterministic active container or leave the server in an error state.

No optional labels are required initially. Additional labels should only be added when they change Collector behavior rather than merely duplicating metadata available from Docker.

## Storage

The default storage directory is `/app/storage`, configurable with:

```bash
SERVER_MONITOR_STORAGE=/app/storage
```

State files are stored in a directory such as:

```text
/app/storage/servers/<uuid>.json
```

The filename is an opaque UUID and is not derived directly from `server_name`. This avoids filesystem path problems caused by spaces, slashes, special characters, or renamed display values.

The file contains the authoritative `server_name`. At startup, the Collector scans only files matching the expected UUID JSON filename pattern and builds a mapping from server name to file. A new server name receives a new UUID file. The same file is reused when its container is restarted or recreated.

A malformed state file must not prevent startup. The Collector should record the error, quarantine or remove the invalid file, and create a fresh state file when the corresponding server is discovered again.

## State File

JSON is the initial output format because it is human-readable and already supported by downstream services.

Example:

```json
{
  "schema_version": 1,
  "server_name": "Hellheim",
  "game_name": "Valheim",
  "parser": {
    "name": "valheim",
    "version": "1.0.0"
  },
  "container": {
    "id": "abc123",
    "name": "valheim-server",
    "status": "running",
    "started_at": "2026-09-20T12:00:00Z"
  },
  "health": {
    "status": "healthy",
    "message": "Server is running",
    "updated_at": "2026-09-20T12:05:00Z",
    "confidence": "high"
  },
  "latest_status": {
    "status": "ONLINE",
    "message": "Server is Running",
    "line": "Game server connected",
    "timestamp": "2026-09-20T12:05:00Z",
    "source": "log_parser"
  },
  "history": [],
  "errors": [],
  "collector": {
    "collector_version": "1.3.0",
    "updated_at": "2026-09-20T12:05:00Z",
    "last_reconciled_at": "2026-09-20T12:05:00Z",
    "last_log_at": "2026-09-20T12:05:00Z",
    "history_dropped": 0,
    "errors_dropped": 0
  }
}
```

`schema_version` identifies the JSON structure. `collector_version` identifies the Collector build that last wrote the file and should come from the build or deployment, for example:

```bash
SERVER_MONITOR_VERSION=1.3.0
```

Each parser declares a static version alongside its name. The active parser name and version are saved in the state file. Parser versions should also be copied onto history and error entries so downstream consumers can identify which parser produced them. A parser replacement may continue using the existing server file and history; the change should be recorded as a lifecycle or configuration event.

There is intentionally no revision counter. Timestamps are sufficient for the current single-Collector design. A content hash or ETag can be added later if downstream caching needs a reliable change token.

When a container stops, the file remains associated with the logical server and records a stopped container plus an offline status. A later container with the same `server_name` updates the same file and preserves bounded history.

## History and Errors

History contains meaningful state transitions and lifecycle events, not every log line. Repeated evidence for the current state updates health timestamps without adding duplicate history entries.

Both collections are bounded independently:

```bash
SERVER_MONITOR_MAX_HISTORY=500
SERVER_MONITOR_MAX_ERRORS=100
```

When a limit is exceeded, retain the newest entries and increment the corresponding dropped counter. Error entries should include at least:

```json
{
  "type": "log_parse_error",
  "message": "Parser failed to process log line",
  "line": "...",
  "timestamp": "2026-09-20T12:05:00Z",
  "source": "log_parser"
}
```

## Log Processing

The log watcher is the primary source of game state. A new watcher first reads only the most recent log lines, then follows the live stream without repeatedly reprocessing the tail.

```bash
SERVER_MONITOR_LOG_TAIL=10000
```

The value is configurable because log volume differs between games. The parser must analyze the recent tail as a whole and determine the current state from available evidence. Seeing an old startup line must not by itself imply that the server is currently healthy.

A parser should distinguish at least:

- startup or transitional state
- confirmed healthy steady state
- known failure or error
- insufficient evidence
- no relevant event

The parser interface should return normalized status events or a recent-log analysis containing status, message, confidence, timestamp, and relevant source lines. Shared normalization should handle timestamps and ANSI escape sequences where possible.

The Collector status vocabulary is uppercase and limited to `STARTING`, `UPDATING`, `ONLINE`, `OFFLINE`, `UNKNOWN`, and `ERROR`. `UNKNOWN` is used when evidence is missing, inconclusive, or the server is responding slowly. The Collector does not persist a `STALE` status; downstream consumers may derive staleness from timestamps and their own timeout policy.

## Reconciliation

The Collector periodically compares Docker state with tracked state files. The default interval is:

```bash
SERVER_MONITOR_RECONCILE_SECONDS=60
```

Reconciliation must:

- discover newly running containers with valid labels
- associate containers with their `server_name` files
- start exactly one watcher per tracked container
- detect containers that stopped without a delivered Docker event
- update stopped or missing state
- detect duplicate server names
- repair stale in-memory tracking
- recreate state when a state file is missing or invalid

Docker events may still be used for fast updates, but reconciliation is the recovery mechanism and must be sufficient on its own after missed events or Collector restarts.

## Restart and Recovery

At startup:

1. Load valid server files and map them by `server_name`.
2. List currently running Docker containers with the enabled label.
3. Validate required labels and select each parser.
4. Mark files whose containers are no longer running as stopped if needed.
5. Create files for newly discovered server names.
6. Start one log watcher for each running tracked container.
7. Read the configured log tail to establish current health.

A restart must not append duplicate offline or startup events merely because the Collector restarted. Lifecycle changes should be idempotent.

If a watcher exits unexpectedly, the Collector should record an error, reconcile the container, and restart the watcher when the container is still running. If the container is stopped, it should record one offline transition and release the watcher.

## Safe File Writes

The Collector may have log, reconciliation, and heartbeat work updating the same server. Use one lock per logical server while modifying state and writing it.

Writes must be atomic:

1. Lock the server state.
2. Apply the update and trim bounded collections.
3. Serialize the complete JSON document to a temporary file in the same directory.
4. Flush the file; use `fsync` when durability is important.
5. Replace the target with `os.replace`.
6. Release the lock.

Readers do not need to copy files. They can open the target normally and will see either the previous complete document or the new complete document, never a partially written JSON file. A reader that already has the old file open can finish reading it safely.

Atomic replacement protects readers from partial writes. Locks protect competing writers from lost updates. If multiple Collector processes may run, an OS-level lock or an external single-instance guarantee is also required; an in-process lock alone is insufficient.

## Configuration

Initial environment variables:

```bash
SERVER_MONITOR_STORAGE=/app/storage
SERVER_MONITOR_VERSION=1.3.0
SERVER_MONITOR_RECONCILE_SECONDS=60
SERVER_MONITOR_LOG_TAIL=10000
SERVER_MONITOR_MAX_HISTORY=500
SERVER_MONITOR_MAX_ERRORS=100
SERVER_MONITOR_LOG_LEVEL=INFO
```

Defaults should be used when optional environment variables are absent, and invalid numeric values should fail clearly at startup rather than silently disabling collection.

## Design Principles

- Docker labels control whether and how a container is tracked.
- `server_name` is the logical identity exposed downstream.
- Log parsing determines game health; Docker state determines container lifecycle.
- Reconciliation repairs missed events and stale in-memory state.
- State files are bounded, inspectable, and atomically replaced.
- Recovery paths are idempotent and must not duplicate lifecycle entries.
