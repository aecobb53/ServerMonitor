# ServerMonitor

ServerMonitor reports Docker game-server state through a small pipeline:

```text
Collector -> shared state files -> Reporter -> Control Core -> UI
```

## Services

- `collector/`: Watches labeled Docker containers, parses supported logs, and writes bounded JSON state files.
- `reporter/`: Watches Collector state files and sends full or incremental updates to Control Core.
- `control_core/`: Authenticates Reporters, keeps current server state in memory, and serves the API used by the UI.
- `ui/`: Browser interface for server status and game content.

## Local Compose

The included Compose file builds the services locally. Set the shared secret before starting it:

```bash
export CONTROL_CORE_KEY="$(openssl rand -hex 32)"
docker compose up --build
```

Reporter and Control Core must use the same `CONTROL_CORE_KEY`. Collector needs read-only access to `/var/run/docker.sock` and a writable shared state directory.

Tracked game-server containers need these Docker labels:

```yaml
labels:
	server_monitor.enabled: "true"
	server_monitor.parser: "valheim"
	server_monitor.server_name: "Hellheim"
```

See [collector/README.md](collector/README.md), [reporter/README.md](reporter/README.md), and [control_core/README.md](control_core/README.md) for service-specific configuration.

## Configuration

Copy the example that matches your role to `.env` and fill it in:

- `.env.control-core.example`: hosting Control Core and the UI.
- `.env.reporter.example`: hosting only the Collector and Reporter.

Use `KEY=value` syntax, because `release.sh` sources the file as shell. Never commit `.env`.

## Releasing

`./release.sh` builds and pushes the images. `--dry-run` shows what would happen, and `--local` builds and tags locally without pushing.

## Tests

```bash
# Reporter -> Control Core HTTP and payload integration tests
pytest -q integration_tests

# Collector parser and state-file tests
cd collector && pytest -q
```

Install development dependencies when needed:

```bash
pip install -e ./collector[dev] -e ./reporter[dev] -e ./control_core[dev]
```

## Current Data Model

Live server state is delivered by Reporter and held in Control Core's in-memory `TrackedReporters` store. A Control Core restart intentionally clears this state; Reporter recovers it on a later Collector state update.

Game-profile content remains file-backed (samples in `control_core/src/content/servers/`, mounted at `/app/content/servers` in the container; see [control_core/README.md](control_core/README.md#content-and-volumes) for the required layout). These JSON files provide display names, descriptions, news, and rules. The UI server-detail page currently requires both a live state record and a matching game-profile file. Consolidating or otherwise deploying that profile content is tracked as deferred Control Core work.
