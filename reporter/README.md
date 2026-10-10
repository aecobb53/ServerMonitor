## Reporter

The Reporter watches the shared Collector storage and sends complete JSON state files to Control Core.

## Runtime configuration

Required environment variables:

- `CONTROL_CORE_URL`: Control Core base URL reachable from the Reporter container.
- `CONTROL_CORE_KEY`: Reserved for Control Core authentication.

Optional environment variables:

- `SERVER_MONITOR_STORAGE`: Shared storage path. Default: `/app/storage`.
- `SERVER_MONITOR_VERSION`: Reporter version override.
- `SERVER_MONITOR_CALLBACK_URL`: Future callback address.
- `REPORTER_RETRY_INITIAL_SECONDS`: Initial request retry delay. Default: `1`.
- `REPORTER_RETRY_MAX_SECONDS`: Maximum request retry delay. Default: `60`.
- `SERVER_MONITOR_LOG_LEVEL`: Python logging level. Default: `INFO`.

The Reporter starts watching files immediately. On a `404` file response, it registers once with Control Core and retries that upload.

### File handling

- Existing UUID-named files under `servers/` are uploaded when the Reporter starts.
- Collector temporary files, `.reporter_uid`, and unrelated JSON files are ignored during live filesystem events.
- Collector atomic renames are handled as updates to the destination file.
- Updates are serialized per relative path so rapid filesystem events do not upload concurrently.

### File API

The first successful upload for a state file uses `POST /control-core/files` with the complete state document. Later updates use `PATCH /control-core/files` with identity fields, changed scalar sections, and only history/error entries newer than the last successful upload. After a Reporter restart, existing files are intentionally sent as full POST requests.

Registration uses `POST /control-core/register`:

```json
{
  "reporter_uid": "...",
  "version": "0.1.0",
  "callback_url": null
}
```

## Future Additions

- Use `CONTROL_CORE_KEY` when Control Core authentication is implemented.
- Add server deletion notifications after the Control Core deletion endpoint exists.
- Revisit delivery retries and registration recovery after the initial deployment behavior is established.
