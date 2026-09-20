# Collector State File Schema

This document defines the JSON files written by the Collector for downstream readers.

## File Discovery

State files are stored under:

```text
/app/storage/servers/
```

The storage root is configurable with `SERVER_MONITOR_STORAGE`. Each file has an opaque UUID filename:

```text
<uuid>.json
```

Readers must inspect the file contents to determine the logical server. The `server_name` field is the server identity; the filename is only a stable storage key.

Only matching JSON state files should be loaded. Unreadable or malformed files should be ignored and reported rather than preventing other servers from being read.

## Example Document

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
    "status": "ONLINE",
    "message": "Server is running",
    "updated_at": "2026-09-20T12:05:00Z",
    "confidence": "high"
  },
  "latest_status": {
    "status": "ONLINE",
    "message": "Server is running",
    "line": "Game server connected",
    "timestamp": "2026-09-20T12:05:00Z",
    "source": "log_parser",
    "parser_version": "1.0.0"
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

## Top-Level Fields

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `schema_version` | integer | yes | Version of this JSON document structure. Current value: `1`. |
| `server_name` | string | yes | Logical server identity from `server_monitor.server_name`. |
| `game_name` | string | yes | Human-readable game name supplied by the parser. |
| `parser` | object | yes | Parser currently assigned to the server. |
| `container` | object | yes | Current or most recently observed Docker container. |
| `health` | object | yes | Collector's current interpretation of server health. |
| `latest_status` | object or null | yes | Most recent normalized status event, if one exists. |
| `history` | array | yes | Bounded list of meaningful status and lifecycle events. |
| `errors` | array | yes | Bounded list of Collector, Docker, and parser errors. |
| `collector` | object | yes | Collector metadata and timestamps. |

## Parser Object

```json
{
  "name": "valheim",
  "version": "1.0.0"
}
```

| Field | Type | Meaning |
|---|---|---|
| `name` | string | Parser registry name selected by `server_monitor.parser`. |
| `version` | string | Static version declared by that parser. |

The parser object describes the parser currently writing the file. Historical events retain their own `parser_version` so readers can interpret older entries after a parser update.

## Container Object

```json
{
  "id": "abc123",
  "name": "valheim-server",
  "status": "running",
  "started_at": "2026-09-20T12:00:00Z"
}
```

| Field | Type | Meaning |
|---|---|---|
| `id` | string or null | Docker container ID. |
| `name` | string or null | Docker container name. |
| `status` | string | Container lifecycle state: `running`, `stopped`, or `unknown`. |
| `started_at` | timestamp or null | Docker start time when known. |

The container may be replaced while the logical server file remains the same. A stopped server file is retained and reused when a later container uses the same `server_name`.

## Health Object

```json
{
  "status": "ONLINE",
  "message": "Server is running",
  "updated_at": "2026-09-20T12:05:00Z",
  "confidence": "high"
}
```

| Field | Type | Meaning |
|---|---|---|
| `status` | string | Current normalized server status. |
| `message` | string | Human-readable explanation. |
| `updated_at` | timestamp | Time this health interpretation was last updated. |
| `confidence` | string | Parser confidence, normally `high`, `medium`, or `low`. |

The Collector status vocabulary is:

- `STARTING`: Server initialization is in progress.
- `UPDATING`: Server or its dependencies are being updated.
- `ONLINE`: Recent log evidence confirms the server is running normally.
- `OFFLINE`: The container or server has stopped.
- `UNKNOWN`: Evidence is absent, inconclusive, or the server is responding slowly.
- `ERROR`: The parser or Collector encountered an operational failure.

`STALE` is not a Collector status. Downstream readers may derive staleness from `updated_at`, `last_log_at`, and their own timeout policy.

## Status Event Objects

`latest_status` and entries in `history` use this shape where applicable:

```json
{
  "status": "ONLINE",
  "message": "Server is running",
  "line": "Game server connected",
  "timestamp": "2026-09-20T12:05:00Z",
  "source": "log_parser",
  "parser_version": "1.0.0"
}
```

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `status` | string | yes | One of the uppercase Collector statuses. |
| `message` | string | yes | Human-readable event description. |
| `line` | string or null | no | Relevant source log line, when available. |
| `timestamp` | timestamp | yes | Time associated with the event. |
| `source` | string | yes | Usually `log_parser`, `docker_event`, `reconciliation`, or `collector`. |
| `parser_version` | string or null | no | Parser version that produced the event. |

History contains meaningful transitions and lifecycle events, not every log line. Repeated evidence for the current status should update health timestamps without creating duplicate history entries.

## Error Objects

```json
{
  "type": "log_parse_error",
  "message": "Parser failed to process log line",
  "line": "...",
  "timestamp": "2026-09-20T12:05:00Z",
  "source": "log_parser",
  "parser_version": "1.0.0"
}
```

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `type` | string | yes | Stable error category. |
| `message` | string | yes | Human-readable error description. |
| `line` | string or null | no | Relevant source log line, when available. |
| `timestamp` | timestamp | yes | Time the error was recorded. |
| `source` | string | yes | Component that produced the error. |
| `parser_version` | string or null | no | Parser version involved, when applicable. |

Errors may describe parser failures, Docker failures, invalid state, duplicate server names, or watcher failures. An error does not necessarily mean the game server is offline; readers should use `health.status` and the error details together.

## Collector Object

```json
{
  "collector_version": "1.3.0",
  "updated_at": "2026-09-20T12:05:00Z",
  "last_reconciled_at": "2026-09-20T12:05:00Z",
  "last_log_at": "2026-09-20T12:05:00Z",
  "history_dropped": 0,
  "errors_dropped": 0
}
```

| Field | Type | Meaning |
|---|---|---|
| `collector_version` | string | Version of the Collector build that last wrote the file. |
| `updated_at` | timestamp | Time the file was last written. |
| `last_reconciled_at` | timestamp or null | Most recent Docker reconciliation. |
| `last_log_at` | timestamp or null | Most recent processed log evidence. |
| `history_dropped` | integer | Number of old history entries removed due to the configured limit. |
| `errors_dropped` | integer | Number of old errors removed due to the configured limit. |

There is no revision counter. Timestamps are the change indicators for the current design.

## Limits and Reader Expectations

The Collector retains only the newest entries within these limits:

```bash
SERVER_MONITOR_MAX_HISTORY=500
SERVER_MONITOR_MAX_ERRORS=100
```

Readers must not assume that `history` contains every event ever observed. The dropped counters indicate that older entries were discarded.

State files are replaced atomically. A reader should open and parse the target JSON file normally; it does not need to copy the file first. It will receive either the previous complete document or the next complete document, not a partially written document.

All timestamps use UTC ISO 8601 format, for example:

```text
2026-09-20T12:05:00Z
```
