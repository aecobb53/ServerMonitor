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

## Deferred Work

- Add Reporter/Control Core server-deletion handling.
- Schedule `TrackedReporters.age_off_stale()` to remove inactive reporters and servers.
- Define the ownership and deployment model for game-profile content. Live Collector state now comes from `TrackedReporters`, while display metadata, descriptions, news, and rules still come from JSON files under `src/content/servers/`. The UI detail endpoints require both records for a server.
- Consolidate broader logging, configuration, and legacy route cleanup after the current flow is complete.
