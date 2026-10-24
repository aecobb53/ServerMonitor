# Admin API Handshake

## Purpose

Define the contract between the Admin UI and FastAPI backend.

The backend is the source of truth. The UI handles presentation and interaction. The backend handles authentication, validation, server operations, configuration changes, and errors.

All Admin endpoints use:

    /api/admin

---

## Authentication

For the initial implementation, authentication uses the admin password directly.

The UI stores the password only in memory while the Admin page is open.

Do not store it in cookies, localStorage, sessionStorage, URLs, or persistent storage.

Admin requests send:

    X-Admin-Password: <password>

All requests must use HTTPS.

If any Admin request returns `401`, the UI must clear the password and return to the login prompt.

The backend must never log the password.

The authentication implementation may later be changed to a session-token approach without changing the overall Admin API structure.

---

## POST /api/admin/login

Validates the admin password.

### Headers

    Content-Type: application/json

### Body

```json
{
  "password": "example-password"
}
```

### Success

Status: `200`

```json
{
  "success": true,
  "data": null
}
```

### Invalid Password

Status: `401`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ADMIN_PASSWORD",
    "message": "Invalid admin password."
  }
}
```

Failed authentication attempts should be rate-limited.

---

## GET /api/admin

Returns the data required to populate the Admin page.

### Headers

    X-Admin-Password: <password>

### Query Parameters

None initially.

### Body

None.

### Success

Status: `200`

Example:

```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "name": "valheim-main",
        "container": {
          "status": "UP",
          "cpu_usage": 12.4,
          "disk_usage": "42 GB / 916 GB",
          "errors": []
        },
        "server": {
          "status": "UP",
          "errors": []
        },
        "mods": [
          {
            "name": "ExampleMod",
            "enabled": true,
            "version": "1.2.3"
          },
          {
            "name": "AnotherMod",
            "enabled": false,
            "version": "2.4.1"
          }
        ]
      }
    ],
    "carousel": [],
    "feed": [],
    "whats_new": []
  }
}
```

The exact statistics may grow over time. The UI should only display data provided by the backend.

The Admin page does not automatically refresh. The Refresh button should call this endpoint again.

---

# Server Actions

## POST /api/admin/servers/{server_name}/start

Starts a specific server.

### Path Parameters

- `server_name`: backend-defined server identifier

Example:

    /api/admin/servers/valheim-main/start

### Headers

    X-Admin-Password: <password>

### Body

None.

### Success

Status: `200`

```json
{
  "success": true,
  "data": {
    "server": "valheim-main",
    "action": "start"
  }
}
```

The backend should initiate the operation without waiting for the server to become operational.

The UI must require confirmation before calling this endpoint.

---

## POST /api/admin/servers/{server_name}/restart

Restarts a specific server.

### Path Parameters

- `server_name`: backend-defined server identifier

Example:

    /api/admin/servers/valheim-main/restart

### Headers

    X-Admin-Password: <password>

### Body

None.

### Success

Status: `200`

```json
{
  "success": true,
  "data": {
    "server": "valheim-main",
    "action": "restart"
  }
}
```

The backend should initiate the operation without waiting for the server to return to `UP`.

The UI must require confirmation before calling this endpoint.

The confirmation should explain that a restart normally completes quickly but may take up to 20 minutes in rare situations.

---

# Mod Configuration

Each server has its own mod list. A server may have no mods.

The UI displays:

- Mod name
- Enabled state
- Version

Disabled mods remain visible and editable.

The version is an arbitrary string. Do not provide a predefined version list.

## PATCH /api/admin/servers/{server_name}/mods/{mod_name}

Updates a mod's configuration.

### Path Parameters

- `server_name`
- `mod_name`

Example:

    /api/admin/servers/valheim-main/mods/ExampleMod

### Headers

    X-Admin-Password: <password>
    Content-Type: application/json

### Body

```json
{
  "enabled": true,
  "version": "1.2.4"
}
```

Both values represent the desired final configuration.

### Success

Status: `200`

```json
{
  "success": true,
  "data": {
    "name": "ExampleMod",
    "enabled": true,
    "version": "1.2.4",
    "restart_required": true
  }
}
```

The backend is responsible for validating and applying the configuration.

Changing a mod must not automatically restart the server.

The UI should use `restart_required` to determine whether to display the restart-required state.

The UI should track multiple changed mods so users can make several changes before restarting.

---

# What's New

## PUT /api/admin/whats-new

Replaces the current What's New list.

### Headers

    X-Admin-Password: <password>
    Content-Type: application/json

### Body

```json
{
  "items": [
    "New server update!",
    "Boss fight Saturday.",
    "New mods installed."
  ]
}
```

### Success

Status: `200`

```json
{
  "success": true,
  "data": {
    "items": [
      "New server update!",
      "Boss fight Saturday.",
      "New mods installed."
    ]
  }
}
```

The backend owns persistence and validation.

---

# Feed

## PUT /api/admin/feed

Replaces the current Feed content.

### Headers

    X-Admin-Password: <password>
    Content-Type: application/json

### Body

Use the existing Feed data structure.

Example:

```json
{
  "items": [
    "Server event occurred.",
    "New screenshot uploaded."
  ]
}
```

The exact structure should be adjusted to match the existing backend implementation.

---

# Carousel

## PUT /api/admin/carousel

Replaces the current Carousel content.

### Headers

    X-Admin-Password: <password>
    Content-Type: application/json

### Body

Use the existing Carousel data structure.

Example:

```json
{
  "items": [
    {
      "image": "/media/example.jpg",
      "title": "Our latest adventure"
    }
  ]
}
```

The exact structure should be adjusted to match the existing backend implementation.

---

# Error Responses

Admin endpoints use the application's existing response format.

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message."
  }
}
```

The frontend should display useful backend-provided messages and should not attempt to determine the underlying cause itself.

---

# HTTP Status Codes

## 200

Request succeeded.

## 400

Request is malformed or contains invalid data.

## 401

Authentication is missing or invalid.

The UI must clear the password and return to the login prompt.

## 404

Requested server, mod, or content does not exist.

## 409

The requested operation conflicts with the current state.

Example:

```json
{
  "success": false,
  "error": {
    "code": "SERVER_ALREADY_RUNNING",
    "message": "The server is already running."
  }
}
```

## 429

Too many requests. Particularly relevant to failed login attempts.

## 500

Unexpected backend failure.

The UI should display the provided error without attempting to infer the cause.

---

# General Rules

- All Admin endpoints use `/api/admin`.
- Admin endpoints require `X-Admin-Password` unless explicitly stated otherwise.
- Passwords must only be transmitted over HTTPS.
- Passwords must never appear in URLs.
- Passwords must never be logged.
- Backend owns validation and business logic.
- Backend owns server state.
- Backend owns error filtering.
- Frontend owns presentation and interaction.
- Frontend must not independently determine server status.
- Frontend must not automatically restart servers after configuration changes.
- Frontend must not automatically poll Admin endpoints.
- Refresh explicitly requests current Admin state.
- Use `POST` for actions such as start/restart.
- Use `PUT` when replacing an entire resource/list.
- Use `PATCH` when modifying part of an existing resource.
- Keep payloads simple and extensible.
- New Admin functionality should follow these conventions.
