# Collector Roadmap

This roadmap implements `architecture-new.md` in small, testable phases. The Collector remains a single Docker-aware process that publishes bounded JSON files; no database, API, queue, or new service is required.

Current progress: Phases 1 and 2 are complete. Phase 3 is next.

## Phase 1: Establish the New Contracts (Complete)

- Move runtime code under `collector/src` cleanly.
- Update the Dockerfile entrypoint and Python import path for the `src` layout.
- Add configuration loading for storage, collector version, reconciliation interval, log tail, history limit, error limit, and log level.
- Define normalized status/event result types.
- Define the parser interface with:
  - parser name
  - static parser version
  - game name
  - single-line parsing
  - recent-log analysis
- Add a parser registry keyed by `server_monitor.parser`.

**Done when:** the collector can load configuration, resolve the Valheim parser by label, and reject unknown parsers without silently falling back.

## Phase 2: Improve the Parser Boundary (Complete)

- Update `BaseParser` to expose the shared contract.
- Update the Valheim parser to return normalized uppercase statuses:
  `STARTING`, `UPDATING`, `ONLINE`, `OFFLINE`, `UNKNOWN`, and `ERROR`.
- Add recent-log analysis for the initial tail.
- Keep parser-specific log matching, timestamp extraction, ANSI cleanup, and health interpretation inside the parser.
- Attach parser name and version to emitted events and errors.

**Done when:** parser tests can analyze a log tail and live lines without depending on Docker or file storage.

## Phase 3: Build Server State and Persistence

- Replace container-oriented state with logical server state keyed by `server_name`.
- Discover existing UUID-named JSON files at startup.
- Reuse a server file across container recreation and Collector restarts.
- Create the new state shape with schema, parser, container, health, latest status, history, errors, and collector metadata.
- Enforce the history and error limits and maintain dropped-entry counters.
- Write complete files through a temporary file and `os.replace`.
- Add one lock per logical server.

**Done when:** concurrent updates cannot produce partial JSON or lose in-process state changes, and malformed state files do not prevent startup.

## Phase 4: Container Discovery and Lifecycle

- Require all three labels before tracking a container.
- Validate `server_monitor.enabled`, `server_monitor.parser`, and `server_monitor.server_name`.
- Detect duplicate active `server_name` values and record a configuration error without allowing silent overwrites.
- Start exactly one watcher per tracked server.
- Make stop/offline handling idempotent.
- Remove stopped containers from active in-memory tracking while retaining their server file.
- Record container replacement and parser changes as events when applicable.

**Done when:** start, stop, restart, duplicate-name, and recreated-container scenarios produce one coherent server file without duplicate lifecycle entries.

## Phase 5: Log Watching and Recovery

- Read only the configured last `N` log lines when a watcher starts.
- Analyze that tail before following new log output.
- Follow live logs without repeatedly processing the initial tail.
- Handle decode failures, parser failures, Docker API failures, and unexpected stream termination as recorded errors.
- Restart a watcher when the container is still running; mark it offline only when Docker confirms the container stopped.
- Use `UNKNOWN` when evidence is absent or inconclusive. Do not create a `STALE` status.

**Done when:** a noisy container is bounded by configuration, a quiet container is not falsely declared offline, and a lost log stream recovers.

## Phase 6: Reconciliation

- Run reconciliation every 60 seconds by default.
- List currently running labeled containers.
- Discover missed starts and remove dead watchers.
- Detect containers that stopped without a delivered Docker event.
- Repair missing, malformed, or stale in-memory state.
- Ensure reconciliation is safe to repeat and does not duplicate history entries.
- Keep Docker events as an optional fast path, not the only recovery mechanism.

**Done when:** stopping or starting containers while events are missed still produces correct state within one reconciliation interval.

## Phase 7: Verification and Deployment

- Add focused unit tests for configuration, labels, parser registry, parser analysis, bounded collections, duplicate names, and state transitions.
- Add persistence tests for atomic replacement and malformed files.
- Add mocked Docker integration tests for startup, event handling, reconciliation, and log-stream recovery.
- Update collector documentation with required labels, environment variables, state-file discovery, and status meanings.
- Verify the Docker image starts from the new `src` layout and writes to the mounted storage volume.

**Done when:** the collector can be exercised without a live game server and the deployment path matches the documented architecture.

## Initial Scope Boundaries

Do not add these during the first implementation:

- additional Docker labels beyond the required three
- a database or message queue
- an HTTP API
- parser-specific labels for stale timeouts or log limits
- a revision counter
- a persisted `STALE` status
- automatic migration of the old state-file format unless existing data must be preserved
