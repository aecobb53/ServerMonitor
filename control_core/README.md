## Control Core

Control Core receives Collector state from Reporter, keeps the current state for each registered reporter in memory, and serves the application API.

## Reporter API

- `POST /control-core/register` registers or refreshes a reporter.
- `POST /control-core/files` stores a complete server-state document.
- `PATCH /control-core/files` merges a partial update for a server owned by the calling reporter.

Reporter registration and server ownership failures intentionally return `404` so callers do not learn whether a reporter or server exists.

History and error retention are configurable:

| Variable | Default |
| --- | --- |
| `CONTROL_CORE_MAX_HISTORY` | `500` |
| `CONTROL_CORE_MAX_ERRORS` | `100` |

## Deferred Work

- Replace the development `Example` reporter handshake with configured authentication for the 1.0 release.
- Add Reporter/Control Core server-deletion handling.
- Schedule `TrackedReporters.age_off_stale()` to remove inactive reporters and servers.
- Migrate UI-facing server-status routes from the legacy file-based reader to the reporter-owned in-memory state.
- Consolidate broader logging, configuration, and legacy route cleanup after the current flow is complete.
