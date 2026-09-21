## Reporter

The Reporter watches the shared Collector storage and sends complete JSON state files to Control Core.

## Runtime configuration

Required environment variables:

- `CONTROL_CORE_URL`: Control Core base URL reachable from the agent container.
- `CONTROL_CORE_KEY`: Bearer credential for Reporter requests.

Optional environment variables:

- `SERVER_MONITOR_STORAGE`: Shared storage path. Default: `/app/storage`.
- `SERVER_MONITOR_VERSION`: Reporter version override.
- `SERVER_MONITOR_CALLBACK_URL`: Future callback address.
- `REPORTER_RETRY_INITIAL_SECONDS`: Initial request retry delay. Default: `1`.
- `REPORTER_RETRY_MAX_SECONDS`: Maximum request retry delay. Default: `60`.
- `SERVER_MONITOR_LOG_LEVEL`: Python logging level. Default: `INFO`.

The Reporter starts watching files immediately and retries Control Core registration independently with exponential backoff. This allows the Reporter and Control Core to start or restart in either order.

### File handling

- Existing UUID-named files under `servers/` are uploaded when the agent starts.
- Collector temporary files, `.reporter_uid`, and unrelated JSON files are ignored.
- Collector atomic renames are handled as updates to the destination file.
- Updates are serialized per relative path so rapid filesystem events do not upload concurrently.

### File API

V1 sends every observed state-file update with `POST /control-core/files` and includes the complete UTF-8 file content. V1 does not use `PATCH` yet. After a Reporter restart, existing files are intentionally sent as full POST requests so the remote store can be rebuilt independently.

The required file endpoint is:

```json
{
  "reporter_uid": "...",
  "path": "servers/example.json",
  "modified_time": 0,
  "content": "{ ... }"
}
```

Deletion notifications use `POST /control-core/files/deleted`.
