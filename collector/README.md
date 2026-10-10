## Collector

Collector watches labeled Docker containers, parses supported game-server logs, and writes one JSON state file per server. It has no network API. A Reporter can read the same storage directory and deliver those files to Control Core.

## Docker Compose

Replace the image name and tag with the published image from your Git registry. Mount the Docker socket read-only and a persistent directory for state files.

```yaml
services:
	collector:
		image: ghcr.io/<owner>/server-monitor-collector:<tag>
		restart: unless-stopped
		environment:
			SERVER_MONITOR_STORAGE: /app/storage
			SERVER_MONITOR_RECONCILE_SECONDS: "60"
			SERVER_MONITOR_LOG_TAIL: "10000"
			SERVER_MONITOR_MAX_HISTORY: "500"
			SERVER_MONITOR_MAX_ERRORS: "100"
			SERVER_MONITOR_LOG_LEVEL: INFO
		volumes:
			- ./server-monitor-state:/app/storage
			- /var/run/docker.sock:/var/run/docker.sock:ro
```

The Docker socket gives Collector visibility into the host's containers. Do not expose it to untrusted containers.

## Container Labels

Add these labels to every container Collector should monitor:

```yaml
services:
	valheim:
		image: <your-game-server-image>
		labels:
			server_monitor.enabled: "true"
			server_monitor.parser: "valheim"
			server_monitor.server_name: "Hellheim"
```

- `server_monitor.enabled`: Must be `true`.
- `server_monitor.parser`: The supported log parser. Currently: `valheim`.
- `server_monitor.server_name`: Unique logical server name.

Collector ignores containers with missing or invalid labels. Do not assign the same server name to more than one running container.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `SERVER_MONITOR_STORAGE` | `/app/storage` | Directory where state files are written. |
| `SERVER_MONITOR_VERSION` | package version | Version written into state metadata. |
| `SERVER_MONITOR_RECONCILE_SECONDS` | `60` | Interval for Docker reconciliation and state heartbeat writes. |
| `SERVER_MONITOR_LOG_TAIL` | `10000` | Number of existing log lines examined when tracking starts. |
| `SERVER_MONITOR_MAX_HISTORY` | `500` | Maximum retained status-history entries per server. |
| `SERVER_MONITOR_MAX_ERRORS` | `100` | Maximum retained errors per server. |
| `SERVER_MONITOR_LOG_LEVEL` | `INFO` | Collector logging level. |

## Output

Collector writes UUID-named JSON files below:

```text
<storage>/servers/<uuid>.json
```

Files contain the current health/status, recent status history, errors, container metadata, parser metadata, and Collector timestamps. Writes use atomic replacement so readers never receive a partially written file.

## Runtime Behavior

- Docker events provide fast container start/stop handling.
- Reconciliation runs at `SERVER_MONITOR_RECONCILE_SECONDS` to recover from missed Docker events.
- State is rewritten on each reconciliation heartbeat so downstream readers can retry delivery after an outage.
- Collector may start independently of Reporter and Control Core.
