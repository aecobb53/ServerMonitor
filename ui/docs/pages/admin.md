# Admin Page

## Purpose

Create a password-protected Admin page for trusted users to perform operational and maintenance tasks that should not clutter the normal application.

The Admin page is located at:

    /admin

Use the existing `ui_style.md` and current project documentation as the source of truth for appearance and existing behavior. Do not redesign unrelated parts of the application.

The page should be a single page containing independently useful cards.

---

## Authentication

When `/admin` is opened:

1. Show a password prompt before displaying Admin content.
2. The user enters the admin password.
3. Keep the password only in frontend memory.
4. Do not store it in cookies, localStorage, sessionStorage, URLs, or other persistent storage.
5. Include the password with Admin API requests according to `admin_api.md`.
6. Leaving the Admin page must clear the password.
7. Returning to `/admin` requires authentication again.
8. If any Admin API request returns an authentication failure:
   - Clear the password from memory.
   - Clear Admin content/state.
   - Return to the password prompt.

The Admin URL should not be linked from the normal application. This is intentional obscurity, not a security mechanism.

---

## Page Behavior

Admin data does not automatically refresh.

Provide a Refresh button near the top of the page.

Refreshing should:

- Re-fetch current Admin data from the backend.
- Update the displayed cards.
- Keep the current authentication state.

Include a small note explaining that Admin does not automatically refresh and that Refresh should be used to obtain current server status.

---

## Server Cards

Display one Admin server card for each server returned by the backend.

The backend determines which servers appear on the Admin page.

Each card should display the backend-provided:

- Server name
- Container status
- CPU usage
- Disk usage
- Container errors
- Server status
- Server errors
- Mods

Use the existing status/badge styling.

Server status values are:

    UP
    DOWN
    UNKNOWN

Do not independently determine server health in the frontend.

Keep the statistics simple. Additional statistics may be added later.

---

## Server Controls

Each server card provides:

- Start
- Restart

Both actions require a confirmation dialog.

The confirmation should clearly identify the server and explain that restarting can take time.

Example:

    Restart Server?

    This will restart the Valheim server.
    The server normally returns quickly, but in rare situations
    recovery may take up to 20 minutes.

    Cancel    Restart

Do not use a countdown.

After an action is initiated, update the UI according to the backend response. The user can also manually Refresh.

---

## Mods

Each server has its own mod list. A server may have no mods.

Display each mod with:

- Mod name
- Enabled/disabled state
- Version

Version is a raw editable text field. Do not provide a version selector.

Disabled mods remain visible and editable, but should appear visually disabled/greyed out.

The backend is responsible for applying the actual mod configuration.

---

## Mod Changes

Changing a mod should not automatically restart the server.

Track which mods have changed and display a clear restart-required banner.

Example:

    Restart required

    The following mods have changed:
    - Mod A
    - Mod B

    These changes have been saved but are not active
    on the server yet.

    Restart Server

Users should be able to make multiple changes before restarting.

The backend remains responsible for applying/updating mod configuration.

---

## Content Cards

Include administrative editing cards for persistent content that currently requires backend/manual modification.

Initial cards:

- Carousel
- Feed
- What's New

These are editing interfaces for existing content, not a separate CMS.

Use the application's existing data structures and conventions.

The backend remains responsible for validation and persistence.

---

## Future Admin Cards

The Admin page should allow additional cards to be added independently.

Potential future functionality includes:

- Event management
- Poll management
- Additional content management
- Additional server configuration
- Other backend-only operations

Do not implement these in Phase 1 unless required by the existing application.

---

## Error Handling

Follow the existing API error-handling conventions.

Display useful backend-provided errors where appropriate.

Do not invent server state or errors in the frontend.

Authentication failures must clear the in-memory password and return to the login prompt.

---

## Implementation Guidelines

- Reuse existing components and styling.
- Keep the page simple and data-driven.
- Backend is the source of truth.
- Do not add background polling.
- Do not persist authentication.
- Do not modify `ui_style.md`.
- Follow the current project architecture.
- Follow `admin_api.md` for API communication.
- Keep Admin cards independently maintainable.
- Do not add unrelated functionality.

---

## Phase 1 Definition of Done

A trusted user can:

1. Navigate directly to `/admin`.
2. Authenticate with the admin password.
3. View current server/container information.
4. Manually refresh server information.
5. Start or restart a server with confirmation.
6. View each server's mods.
7. Change mod versions.
8. Enable/disable mods.
9. See which mods have changed.
10. See when a restart is required.
11. Restart the server after configuration changes.
12. Edit Carousel, Feed, and What's New content.
13. Have authentication state cleared when leaving the Admin page or when authentication fails.

The implementation should remain small and straightforward so additional Admin cards can be added later.
