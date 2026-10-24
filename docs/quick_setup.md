# Running Collector and Reporter

Collector watches labeled game-server containers and writes state files. Reporter reads those files and sends them to Control Core.

## docker-compose.yml

Images are published by `release.sh` as `ghcr.io/aecobb53/<service>:<version>`. Only version tags are pushed, so use an explicit version rather than `latest`.

```yaml
services:
  collector:
    image: ghcr.io/aecobb53/collector:0.1.1
    restart: unless-stopped
    environment:
      LOG_LEVEL: WARNING
      SERVER_MONITOR_STORAGE: /app/storage
      SERVER_MONITOR_RECONCILE_SECONDS: "60"
      SERVER_MONITOR_LOG_TAIL: "10000"
      SERVER_MONITOR_MAX_HISTORY: "500"
      SERVER_MONITOR_MAX_ERRORS: "100"
    volumes:
      - ./shared/states:/app/storage
      - /var/run/docker.sock:/var/run/docker.sock:ro

  reporter:
    image: ghcr.io/aecobb53/reporter:0.1.1
    restart: unless-stopped
    environment:
      LOG_LEVEL: INFO
      SERVER_MONITOR_STORAGE: /app/storage
      CONTROL_CORE_URL: <control-core-url>
      CONTROL_CORE_KEY: "${CONTROL_CORE_KEY:?CONTROL_CORE_KEY is required}"
      SERVER_MONITOR_CALLBACK_URL: "${SERVER_MONITOR_CALLBACK_URL:-}"
      REPORTER_RETRY_INITIAL_SECONDS: "1"
      REPORTER_RETRY_MAX_SECONDS: "60"
    volumes:
      - ./shared/states:/app/storage
```

Both services must mount the same host directory (`./shared/states`) so Reporter can read what Collector writes.

## Required environment

Copy [`.env.reporter.example`](../.env.reporter.example) to `.env` next to `docker-compose.yml` and fill it in. It lists every variable below:

```env
CONTROL_CORE_KEY=<key provided by the Control Core owner>
```

| Variable | Service | Required | Purpose |
| --- | --- | --- | --- |
| `CONTROL_CORE_KEY` | Reporter | Yes | Auth key for Control Core. Compose refuses to start without it. |
| `CONTROL_CORE_URL` | Reporter | Yes | Control Core address. Set to correct url in the compose file. |

## Optional environment

| Variable | Service | Default | Purpose |
| --- | --- | --- | --- |
| `SERVER_MONITOR_CALLBACK_URL` | Reporter | unset | Callback URL sent along with reports. Set it in `.env` if the Control Core owner asks for one. |
| `SERVER_MONITOR_STORAGE` | Both | `/app/storage` | State directory inside the container. Leave as is. |
| `LOG_LEVEL` | Both | Collector `WARNING`, Reporter `INFO` | `DEBUG`, `INFO`, or `WARNING`. Use `DEBUG` to diagnose issues. |
| `SERVER_MONITOR_RECONCILE_SECONDS` | Collector | `60` | Docker reconciliation / heartbeat interval. |
| `SERVER_MONITOR_LOG_TAIL` | Collector | `10000` | Existing log lines scanned when tracking starts. |
| `SERVER_MONITOR_MAX_HISTORY` | Collector | `500` | Max status-history entries per server. |
| `SERVER_MONITOR_MAX_ERRORS` | Collector | `100` | Max retained errors per server. |
| `REPORTER_RETRY_INITIAL_SECONDS` | Reporter | `1` | Initial retry delay after a failed send. |
| `REPORTER_RETRY_MAX_SECONDS` | Reporter | `60` | Maximum retry delay. |

## Labels on monitored game servers

Collector only tracks containers with these labels:

```yaml
labels:
  server_monitor.enabled: "true"
  server_monitor.parser: "valheim"
  server_monitor.server_name: "MyServerName"
```

`server_monitor.server_name` must be unique per running container. Currently supported parser: `valheim`.

## Server content (Reporter)

Reporter generates a default server content file if none exists. To customize it, bind-mount a host directory onto `/app/content/servers` in the Reporter service. Mount a directory you own, because Docker creates missing mount sources as root.

## Run

```bash
docker compose pull
docker compose up -d
```

If the packages are private on GHCR, log in first with a token that has `read:packages`: `docker login ghcr.io -u <github-username>`.
