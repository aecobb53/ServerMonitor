# Release 1.0

Exciting! I am looking to do any cleanup or last minute updates required for a 1.0 update. There are many things I have as open items for future work

## Plan

Status: the Phase 2-3 code changes were reverted (they broke a real deployment, see below). The tree is at the Phase 1 commit plus documentation updates. Phases 2-3 are not started in code; the items below are what was learned and what is deferred.

Work top to bottom. Phases 1-2 must be done before the repo switch (Phase 6).

### Deployment notes (from testing)

- Bind-mounting a host directory onto `/app/content` replaces the whole directory. Copying content into itself (`content/content/`) causes `FileNotFoundError: /app/content/whats_new.json`. Documented in `control_core/README.md`.
- Root-owned directories appear when Docker creates a missing mount source.
- If Phase 2-3 changes are redone, redo them in small separate commits and test against a real compose deployment (with mounted content) before merging.

### Phase 1: Privacy and secrets sweep (current tree) - COMPLETE

Initial scan found `nax.lol` and `aecobb53` in these places (not exhaustive, re-run before release):

- [x] `docker-compose.yml`: Traefik `Host(...)` rules for `*.nax.lol`. Move to env vars (e.g. `${REPORTER_HOST}`) with `.env.example` (done: hosts removed from compose by you)
- [x] `docs/quick_setup.md`: `ghcr.io/aecobb53/...` image paths kept on purpose (public GitHub username, needed to pull images)
- [x] `control_core/src/content/**` (events, requests, polls, carousel, servers, whats_new): real URLs/domains and possibly real content. Replace with `example.com` sample data (done: replaced with neutral samples (Example server, ExampleUser))
- [x] `ui/supported_text_formatting.md` and the UI link-trust allowlist: `nax.lol` hardcoded. Make configurable (done: UI re-scanned, only base64 hash false positives remain)
- [x] `shared/states/servers/*.json`: runtime state committed to the repo. Remove it and add to `.gitignore` (done: untracked, covered by `shared/*` in `.gitignore`)
- [x] `reporter/content/servers/_template.json`, `reporter/src/main.py`, `ui/package.json`, `ui/tsconfig*.json`, `ui/package-lock.json`: review matches (likely package names, "/home/" style paths) (done: template now built into `reporter/src/defaults.py`; remaining matches were false positives)
- [x] Search for: names, emails, IPs (LAN/public), hostnames, home paths, Discord/Steam IDs, server names/ports, Docker volume paths (done: only `LICENSE` copyright name and one test-fixture comment remain (decide, see below))
- [x] Check `ai_docs/`, `things_to_fix.md`, `integration_tests/`, and any notes files for personal info (done: nothing identifying. `things_to_fix.md` is untracked; move to issues or delete)
- [x] Check `.gitignore` covers `.env`, logs, databases, local config, `shared/states` (done: added `.vscode/`, `reporter/content/*`, `integration_tests/fixtures/`)
- [x] `.env.control-core.example` (Control Core + UI) and `.env.reporter.example` (Collector + Reporter) created
- [x] `LICENSE` copyright holder reviewed

### Phase 2: Security review

- [x] Admin auth: constant-time compare + shared login lockout (`common/admin_auth.py`, tests in `control_core/tests`). Lockout is keyed on the real client via `TRUSTED_PROXY_HOPS`
- [ ] Admin password passed in header `X-Admin-Password`: confirm HTTPS only, and no logging of headers
- [x] Generic 500 for unconfigured admin (no env var name leaked)
- [ ] Fail closed if `SERVER_ADMIN_PASSWORD` / `CONTROL_CORE_KEY` are unset (some paths already do; verify all in `control_core/src/routes/*`)
- [ ] Reporter endpoints: validate payload sizes and schemas
- [ ] CORS and trusted-host settings reviewed
- [ ] UI: markdown/link rendering sanitized (XSS), link allowlist enforced
- [x] UI base image moved off EOL Node 18 to `node:22-alpine`
- [ ] Pin base image versions. Non-root deferred (acceptable for friends-scale use)
- [ ] DEFERRED until usage grows: auth on events/requests/polls/gallery writes, upload size limits (intentionally open for ease of use today)
- [ ] `pip-audit` and `npm audit` clean or documented
- [ ] `bandit -r` on the Python services

### Phase 3: Code cleanup

- [ ] Remove commented-out code (e.g. `control_core/src/routes/servers/route.py` old admin session block, commented header in `control_core/route.py`)
- [ ] Remove duplicate/legacy routes: `control_core/admin_route.py` vs `admin/route.py`, check which are live
- [ ] Remove debug prints, stale TODOs (convert to issues)
- [ ] Decide on carousel filter: finish it or remove the dead code
- [ ] Run formatter/linter (`ruff`, `eslint`) and type checker (`pyright`/`tsc`)
- [ ] Remove unused dependencies from `requirements.txt` / `package.json`

### Phase 4: Quality and automation

- [ ] Tests pass locally (unit and `integration_tests/`)
- [ ] GitHub Actions: lint + test + build on PR; release workflow replacing/wrapping `release.sh`
- [ ] Lock/pin dependencies
- [ ] Healthchecks in compose for each service
- [ ] Dependabot, secret scanning, push protection enabled (after new repo created)

### Phase 5: Documentation and versioning

- [ ] README: overview, architecture diagram, quick start, config reference (all env vars), screenshots (scrubbed of personal data)
- [x] `.env.control-core.example` and `.env.reporter.example` restored, README / quick_setup / control_core README point to them (`.env.example` removed)
- [x] README, control_core README and quick_setup document `.env`, `release.sh --local`, content mount layout
- [ ] Document API and config/data schema as the 1.0 stable contract; note migration from 0.x
- [ ] `CHANGELOG.md`, `SECURITY.md`, optionally `CONTRIBUTING.md`
- [ ] Verify `LICENSE` and the copyright holder name is what you want public
- [ ] Single source of truth for version, and bump all services to 1.0.0
- [ ] Update `docs/quick_setup.md` to use 1.0.0 images
- [ ] Fresh-machine test: follow quick setup docs from scratch

### Phase 6: Repo switch

- [ ] Run `gitleaks detect --no-git` on the final tree before copying (and `gitleaks detect` on the old history to learn what to rotate)
- [ ] Set repo-local git email to the GitHub noreply address (`39382051+aecobb53@users.noreply.github.com`) before the first commit of the new repo
- [ ] Rotate `SERVER_ADMIN_PASSWORD`, `CONTROL_CORE_KEY`, and any other credential that ever appeared in the old history
- [ ] Confirm no secrets are baked into the 1.0.0 Docker images (`docker history`)
- [ ] Back up old repo (private), including issues/wiki you want to keep
- [ ] Final gitleaks scan on the tree to be copied
- [ ] Copy files without `.git`, `git init`, set noreply author email, single initial commit
- [ ] Create the new repo under a temporary name, push, verify, then delete the old repo and rename the new one (avoids redirect issues)
- [ ] Re-create settings: branch protection, secrets, Actions variables, topics, description
- [ ] Update external references: GHCR image names, deploy hosts' git remotes, badges
- [ ] Delete/clean old GHCR image versions if they contain sensitive content
- [ ] Ask GitHub Support to purge cached views if the old repo was ever public

### Phase 7: Release

- [ ] Tag `v1.0.0`, push, build and publish images
- [ ] GitHub Release with notes from CHANGELOG
- [ ] Create `post-1.0` milestone and file the Future work items as issues

## Future work (post-1.0)

- Add a button to admin page to log currently connected reporters
- The carousel does not filter but the code exists
- Allow individual servers to have specific carousel and stuff
- Better testing... like actual testing so I can test before deploying
- ensure all ui things have been added and plan for anything we still want to implement



