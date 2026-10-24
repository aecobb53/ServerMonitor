# Reporter Admin Page Specification

## Purpose

The Reporter Admin page lets an authorized user manage one game server
and inspect its operational status, controls, logs, and errors.

The page is separate from the master Admin page. The browser
communicates only with ControlCore. The Reporter remains the
authoritative source for server metadata.

## Routes

-   **Reporter Admin:** `/servers/{server_slug}/admin`
-   **Public server page:** `/servers/{server_slug}`
-   **Master Admin:** `/admin`

The Reporter Admin page manages exactly one server. Other servers
associated with the same Reporter have their own routes.

The server slug identifies the target server. If the slug changes, the
old URL should no longer resolve to that server. This is intentional:
the old server identity is considered no longer to exist under its old
slug.

The URL identifies the requested resource; it does not grant
authorization.

## Page Layout

Use the existing site design system and `ui_style.md` as the visual
baseline. Retain the established dark palette, rounded cards, spacing,
typography, and responsive behavior. Do not redesign unrelated parts of
the site.

Sections, in order:

1.  Page header and server identity
2.  Server Information
3.  Server Status & Controls
4.  Logs
5.  Errors

Do not include a Mods section.

### 1. Page Header

Show the server's display name and game, with a clear indication that
this is the server's admin page. Provide a way to return to the public
server page.

Authentication is required before protected server information or
editing controls are available.

### 2. Server Information

Show server identifying information and editable metadata.

**Read-only fields** - `server_name` - `game` - `display_name`

These values are supplied by the Reporter during registration and are
not editable here.

**Description** - Edit `description` using a multiline text area. -
Preserve line breaks and the project's existing text-formatting
conventions. - Provide an Edit/Preview toggle. Preview renders the text
with the same renderer used on the public server page
(`MarkdownText`).

**News** - Edit `news` as a list of strings. - Support adding, editing,
and deleting individual entries. No reordering. - Do not combine the
list into one serialized text field.

**Rules** - Edit `rules` as a list of strings. - Support adding,
editing, and deleting individual entries. No reordering. - Use the same
reusable list-editor behavior as News.

The UI enforces no length or count limits. Backend validation errors
(`400`/`422`) are displayed to the user.

Provide one **Save changes** action for the Server Information card.
Users can make several changes before saving them together.

Show a clear unsaved-changes state. If the user tries to navigate away
with unsaved edits, warn them before discarding those edits.

Only report success after the Reporter confirms that it has saved the
changes. If saving fails, show an actionable error and preserve the
user's unsaved form values so they can retry.

### 3. Server Status & Controls

Display the server and container status information available from the
backend. Reuse existing status fields and patterns from the current
Admin page wherever possible.

Include the following where data is available: - Container status - CPU
usage - Disk usage - Container errors - Server status - Server errors

Do not invent values when data is unavailable. Use an appropriate
unavailable or unknown state.

Provide **Start** and **Restart** controls.

-   Starting or restarting requires confirmation.
-   Restart confirmation should explain that a normal restart is quick,
    but in rare cases it can take up to 20 minutes.
-   Do not add a countdown.
-   Initiate the action without blocking the page until the server
    becomes healthy. Show the action result and let the user explicitly
    refresh status afterward.
-   The backend must validate the target server and authorize the
    action. Never accept arbitrary command names or paths from the
    browser.

### 4. Logs

Provide a collapsible **Logs** section, collapsed by default.

The backend supplies logs as a list of strings. Render each string as an
individual entry, preserving list order.

-   Wrap long lines so they do not force horizontal page overflow.
-   Preserve line breaks within an entry where appropriate.
-   If the list is empty, show `No logs available.`
-   Do not invent timestamps, severity levels, or other metadata that
    the backend does not provide.

### 5. Errors

Provide a collapsible **Errors** section, collapsed by default.

The backend supplies errors as a list of strings. Render each string as
an individual entry, preserving list order.

-   Wrap long lines so they do not force horizontal page overflow.
-   Preserve line breaks within an entry where appropriate.
-   If the list is empty, show `No errors available.`
-   The backend is responsible for filtering which errors are useful to
    display.

Logs and Errors should use consistent interaction and layout patterns.

## Authentication and Authorization

Accept either: 1. The password assigned to the Reporter that owns this
server. 2. The master admin password.

Reject all other passwords.

The Reporter password grants access only to servers owned by that
Reporter. The master admin password grants access to any server.

ControlCore must determine which credential was supplied and enforce its
scope on every protected request, including reads and writes. Do not
rely only on the initial page login.

### Credential handling

-   Keep the entered password in frontend memory only.
-   Do not store it in cookies, local storage, session storage, the URL,
    or other persistent browser storage.
-   Include the password in the `X-Admin-Password` header on each
    protected API request.
-   Do not log passwords.
-   Use HTTPS for password submission.
-   Rate-limit failed authentication attempts.
-   Clear the password and protected page state when the user leaves the
    Reporter Admin page.
-   If a protected request returns `401`, clear the password and
    protected page state and return to the login prompt.

The Reporter passkey is a backend-to-backend credential. It must never
be sent to the browser or exposed in a frontend response.

### Server targeting

The browser sends requests to ControlCore only. ControlCore resolves the
server slug to the correct server and Reporter, checks authorization,
and forwards the operation to that Reporter using the stored Reporter
passkey.

Never trust the route slug or a client-supplied identifier as proof of
authorization.

## Endpoints

The browser talks only to ControlCore and never to a Reporter. All
routes live under `/control-core/admin` and use the standard response
format. The password is sent in `X-Admin-Password`, handled exactly as
in `admin_api.md`. The UI never learns whether the password was the
Reporter password or the master password.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST | `/control-core/admin/login` | Body `{ "password", "server_slug" }`. `200` if valid for that server, else `401`. |
| GET | `/control-core/admin/servers/{slug}` | Everything needed to populate the page. |
| PATCH | `/control-core/admin/servers/{slug}` | Save `description`, `news`, `rules` together. |
| POST | `/control-core/admin/servers/{slug}/start` | Start the server. No body. |
| POST | `/control-core/admin/servers/{slug}/restart` | Restart the server. No body. |

GET response `data`:

    {
      "offline": false,
      "info": { "server_name": "", "game": "", "display_name": "",
                "description": "", "news": [], "rules": [] },
      "status": {
        "container": { "status": "UP", "cpu_usage": 12.4,
                       "disk_usage": "42 GB / 916 GB", "errors": [] },
        "server": { "status": "UP", "errors": [] }
      },
      "logs": [],
      "errors": []
    }

-   All data is served from ControlCore. The UI never fetches from a
    Reporter.
-   `offline: true` means the Reporter is unreachable. The UI shows an
    OFFLINE indicator and disables Save, Start, and Restart. `status`,
    `logs`, and `errors` may be null. `info` is shown as provided.
-   The UI displays all logs and errors it receives. Size limits are a
    backend concern.
-   PATCH returns `503` with `REPORTER_OFFLINE` if the Reporter cannot
    be reached. Start/restart return `{ "server": slug, "action": ... }`.
-   A password valid for a different Reporter's server returns `401` on
    login and `403` on other endpoints.
-   An unknown slug renders a 404 page with a button back to the
    servers page.

## Entry Point and Deployment

-   Each public server page gets an **Admin** button linking to
    `/servers/{server_slug}/admin`. The master Admin page does not link
    to server admin pages.
-   The page is part of the existing UI image. The nginx config already
    falls back to `index.html` and proxies `/api/`, so no deployment
    change is needed beyond adding the route.

## Layout Notes

-   Match the existing Admin page: minimal header, no carousel or
    ticker.
-   Reuse existing components (`Card`, `Button`, `StatusBadge`,
    `PageHeader`, `LoadingState`, `ErrorState`, `MarkdownText`).
-   Logs and Errors are monospace, one entry per row with minimal gap,
    wrapped, no copy button.
-   Build desktop and mobile together.

## Save and Synchronization Behavior

The Reporter is the authoritative source for its server metadata.
ControlCore maintains a cached copy for the rest of the site.

For metadata updates:

1.  The browser submits changes to ControlCore.
2.  ControlCore authenticates the request and checks that the password
    is authorized for the target server.
3.  ControlCore forwards the update to the owning Reporter.
4.  The Reporter validates and saves the update.
5.  After confirmation from the Reporter, ControlCore updates its cached
    copy and returns success to the browser.

If the Reporter is unavailable or rejects the update, return an error.
Do not claim success and do not update ControlCore's cached metadata as
though the change succeeded.

## Refresh Behavior

Admin data does not automatically refresh.

Provide an explicit **Refresh** action to reload current server
information, status, logs, and errors. Refreshing should preserve the
in-memory password unless authentication fails.

If the page contains unsaved edits, ask before refreshing if the refresh
would discard them.

## API and Error Handling

Use the project's existing API response format.

Success:

    {
      "success": true,
      "data": {}
    }

Error:

    {
      "success": false,
      "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable explanation"
      }
    }

Use appropriate HTTP status codes, including `401` for failed or expired
authentication, `403` for an authenticated user without permission,
`404` when the server slug does not resolve, and suitable `5xx`
responses for server-side failures.

Do not expose Reporter passkeys, passwords, internal secrets, or
sensitive implementation details in errors.

## Responsive Behavior and Accessibility

-   Follow existing responsive layout conventions.
-   Keep cards readable on narrow screens.
-   Ensure list controls and confirmation dialogs work on touch screens.
-   Give controls clear labels and accessible names.
-   Make expanded/collapsed state apparent and operable with a keyboard.
-   Do not rely on color alone to communicate status or errors.

## Out of Scope

-   Mod management
-   Editing `server_name`, `game`, or `display_name`
-   Editing the `expected` field
-   Automatic polling or live updates
-   Direct browser-to-Reporter communication
-   Exposing Reporter passkeys to the frontend
-   Arbitrary host command execution

## Acceptance Criteria

-   [ ] The page is available at `/servers/{server_slug}/admin`.
-   [ ] The page manages only the server identified by the slug.
-   [ ] Authentication accepts the owning Reporter's password or the
    master admin password, and rejects all others.
-   [ ] Reporter-scoped passwords cannot edit servers owned by another
    Reporter.
-   [ ] Protected requests are authorized by ControlCore on every
    request.
-   [ ] The browser never receives the Reporter passkey.
-   [ ] Description is edited in a multiline text area with a preview.
-   [ ] News and Rules are editable lists with add, edit, and delete
    controls.
-   [ ] Each public server page has an Admin button to this page.
-   [ ] An unknown slug shows a 404 with a button to the servers page.
-   [ ] An `offline` response shows an OFFLINE indicator and disables
    Save, Start, and Restart.
-   [ ] Saving waits for Reporter confirmation before reporting success
    or updating ControlCore's cache.
-   [ ] Failed saves preserve unsaved form values and display an error.
-   [ ] Start and Restart require confirmation.
-   [ ] Logs and Errors are collapsed by default and render
    backend-provided lists of strings.
-   [ ] Empty Logs and Errors lists have clear empty states.
-   [ ] Admin data refreshes only when requested.
-   [ ] Leaving the page or receiving a `401` clears the in-memory
    password and protected state.
-   [ ] No Mods section is present.
