## Control Core

Control Core receives Collector state from Reporter, keeps the current state for each registered reporter in memory, and serves the application API.

## Reporter API

- `POST /control-core/register` registers or refreshes a reporter.
- `POST /control-core/files` stores a complete server-state document.
- `PATCH /control-core/files` merges a partial update for a server owned by the calling reporter.

Reporter registration and server ownership failures intentionally return `404` so callers do not learn whether a reporter or server exists.

`CONTROL_CORE_KEY` is required. Reporter must send the same value in the `server-password` header for registration and file requests.

History and error retention are configurable:

| Variable | Default |
| --- | --- |
| `CONTROL_CORE_MAX_HISTORY` | `500` |
| `CONTROL_CORE_MAX_ERRORS` | `100` |

`LOG_LEVEL` sets the logging level (any Python logging level). Default: `INFO`.

## Environment

Copy [`.env.control-core.example`](../.env.control-core.example) to `.env` and fill it in.

| Variable | Required | Purpose |
| --- | --- | --- |
| `CONTROL_CORE_KEY` | Yes | Shared secret Reporters send in the `server-password` header. |
| `SERVER_ADMIN_PASSWORD` | For admin pages | Password for the admin pages. Admin endpoints fail if unset. |
| `REPORTER_ADMIN_PASSWORDS` | For per-server admin | JSON map of reporter/server to admin password. |
| `CONTROL_CORE_AGE_OFF_INTERVAL_SECONDS` | No | Stale reporter age-off interval. |
| `CONTROL_CORE_MAX_HISTORY` / `CONTROL_CORE_MAX_ERRORS` | No | Retention limits (see above). |
| `LOG_LEVEL` | No | Logging level. |

## Content and volumes

Control Core reads and writes content under `/app/content` and gallery images under `/app/images` inside the container.

Expected layout of `/app/content`:

```text
feed.yaml  whats_new.json  carousel.json
servers/  events/  requests/  polls/  poll_responses/
```

Sample content lives in `control_core/src/content/` in this repo. If you bind-mount a host directory onto `/app/content`, it **replaces** the whole directory, so the host directory must contain the layout above directly. Common mistake: copying the folder into itself (`content/content/...`), which gives `FileNotFoundError: /app/content/whats_new.json`. Directories Docker creates for a missing mount source are owned by root.

## Deferred Work

- Add Reporter/Control Core server-deletion handling.
- Schedule `TrackedReporters.age_off_stale()` to remove inactive reporters and servers.
- Define the ownership and deployment model for game-profile content. Live Collector state now comes from `TrackedReporters`, while display metadata, descriptions, news, and rules still come from JSON files under `src/content/servers/`. The UI detail endpoints require both records for a server.
- Consolidate broader logging, configuration, and legacy route cleanup after the current flow is complete.
