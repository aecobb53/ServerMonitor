# Admin API Requirements (Swagger-Style Contract)

This document defines the minimum contract required for the Admin UI prototype. It is intentionally concrete enough to build against immediately while still allowing the backend to evolve.

The UI should treat the backend as the source of truth. The backend owns validation, persistence, and server actions.

## Base URL

```text
https://<host>/api/admin
```

## Authentication

All Admin endpoints require the following header unless explicitly noted otherwise:

```http
X-Admin-Password: <admin-password>
```

The password must never be stored in persistent storage. It is kept in memory only while the Admin page is active.

If a request returns `401`, the UI must clear the in-memory password and return to the login screen.

## Common Response Format

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

## Common HTTP Codes

- `200` - Request succeeded
- `400` - Invalid request payload or request shape
- `401` - Missing or invalid admin password
- `404` - Resource not found
- `409` - State conflict (example: server already running)
- `429` - Rate-limited or too many failed auth attempts
- `500` - Unexpected backend error

---

# Schemas

## AdminServer

```json
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
```

### Field notes

- `container.status` values: `UP`, `DOWN`, `UNKNOWN`
- `server.status` values: `UP`, `DOWN`, `UNKNOWN`
- `cpu_usage` is numeric percent, may be `null` if unavailable
- `disk_usage` is a string and may be backend-formatted
- `errors` is an array of strings
- `mods` may be an empty array

## ModConfig

```json
{
  "name": "ExampleMod",
  "enabled": true,
  "version": "1.2.4",
  "restart_required": true
}
```

## CarouselItem

```json
{
  "image": "/media/example.jpg",
  "title": "Our latest adventure"
}
```

## FeedItem

```json
{
  "text": "Server event occurred."
}
```

## WhatsNewItem

```json
{
  "text": "New server update!"
}
```

## AdminPageData

```json
{
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
        }
      ]
    }
  ],
  "carousel": [
    {
      "image": "/media/example.jpg",
      "title": "Our latest adventure"
    }
  ],
  "feed": [
    {
      "text": "Server event occurred."
    }
  ],
  "whats_new": [
    {
      "text": "New server update!"
    }
  ]
}
```

---

# Endpoints

## POST /api/admin/login

Authenticates the admin password.

### Headers

```http
Content-Type: application/json
```

### Request Body

```json
{
  "password": "example-password"
}
```

### Example Success Response

```json
{
  "success": true,
  "data": null
}
```

### Example Failure Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ADMIN_PASSWORD",
    "message": "Invalid admin password."
  }
}
```

### Status Codes

- `200` success
- `401` invalid password
- `429` too many attempts
- `500` unexpected error

---

## GET /api/admin

Returns the complete data set required to render the Admin page.

### Headers

```http
X-Admin-Password: <admin-password>
```

### Query Parameters

None required for Phase 1.

### Example Success Response

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
      },
      {
        "name": "valheim-test",
        "container": {
          "status": "DOWN",
          "cpu_usage": 0,
          "disk_usage": "18 GB / 200 GB",
          "errors": [
            "Container exited unexpectedly"
          ]
        },
        "server": {
          "status": "DOWN",
          "errors": [
            "Server not responding"
          ]
        },
        "mods": []
      }
    ],
    "carousel": [
      {
        "image": "/media/example.jpg",
        "title": "Our latest adventure"
      }
    ],
    "feed": [
      {
        "text": "Server event occurred."
      },
      {
        "text": "New screenshot uploaded."
      }
    ],
    "whats_new": [
      {
        "text": "New server update!"
      },
      {
        "text": "Boss fight Saturday."
      }
    ]
  }
}
```

### Status Codes

- `200` success
- `401` invalid auth
- `500` backend failure

---

## POST /api/admin/servers/{server_name}/start

Starts a specific server.

### Path Parameters

- `server_name` (string, required)

Example:

```text
/api/admin/servers/valheim-main/start
```

### Headers

```http
X-Admin-Password: <admin-password>
```

### Request Body

None.

### Example Success Response

```json
{
  "success": true,
  "data": {
    "server": "valheim-main",
    "action": "start"
  }
}
```

### Example Failure Response

```json
{
  "success": false,
  "error": {
    "code": "SERVER_ALREADY_RUNNING",
    "message": "The server is already running."
  }
}
```

### Status Codes

- `200` success
- `401` invalid auth
- `404` server not found
- `409` state conflict
- `500` backend failure

---

## POST /api/admin/servers/{server_name}/restart

Restarts a specific server.

### Path Parameters

- `server_name` (string, required)

Example:

```text
/api/admin/servers/valheim-main/restart
```

### Headers

```http
X-Admin-Password: <admin-password>
```

### Request Body

None.

### Example Success Response

```json
{
  "success": true,
  "data": {
    "server": "valheim-main",
    "action": "restart"
  }
}
```

### Status Codes

- `200` success
- `401` invalid auth
- `404` server not found
- `409` state conflict
- `500` backend failure

---

## PATCH /api/admin/servers/{server_name}/mods/{mod_name}

Updates a single mod's enabled state and version.

### Path Parameters

- `server_name` (string, required)
- `mod_name` (string, required)

Example:

```text
/api/admin/servers/valheim-main/mods/ExampleMod
```

### Headers

```http
X-Admin-Password: <admin-password>
Content-Type: application/json
```

### Request Body

```json
{
  "enabled": true,
  "version": "1.2.4"
}
```

### Example Success Response

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

### Example Failure Response

```json
{
  "success": false,
  "error": {
    "code": "MOD_NOT_FOUND",
    "message": "The requested mod was not found for this server."
  }
}
```

### Status Codes

- `200` success
- `400` invalid payload
- `401` invalid auth
- `404` server or mod not found
- `500` backend failure

---

## PUT /api/admin/whats-new

Replaces the current What's New list.

### Headers

```http
X-Admin-Password: <admin-password>
Content-Type: application/json
```

### Request Body

```json
{
  "items": [
    "New server update!",
    "Boss fight Saturday.",
    "New mods installed."
  ]
}
```

### Example Success Response

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

### Status Codes

- `200` success
- `400` invalid data
- `401` invalid auth
- `500` backend failure

---

## PUT /api/admin/feed

Replaces the current Feed content.

### Headers

```http
X-Admin-Password: <admin-password>
Content-Type: application/json
```

### Request Body

Use the existing Feed data structure for the application. Minimal prototype example:

```json
{
  "items": [
    {
      "text": "Server event occurred."
    },
    {
      "text": "New screenshot uploaded."
    }
  ]
}
```

### Example Success Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "text": "Server event occurred."
      },
      {
        "text": "New screenshot uploaded."
      }
    ]
  }
}
```

### Status Codes

- `200` success
- `400` invalid data
- `401` invalid auth
- `500` backend failure

---

## PUT /api/admin/carousel

Replaces the current Carousel content.

### Headers

```http
X-Admin-Password: <admin-password>
Content-Type: application/json
```

### Request Body

Use the existing Carousel data structure for the application. Minimal prototype example:

```json
{
  "items": [
    {
      "image": "/media/example.jpg",
      "title": "Our latest adventure"
    },
    {
      "image": "/media/second.jpg",
      "title": "Weekend raid plans"
    }
  ]
}
```

### Example Success Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "image": "/media/example.jpg",
        "title": "Our latest adventure"
      },
      {
        "image": "/media/second.jpg",
        "title": "Weekend raid plans"
      }
    ]
  }
}
```

### Status Codes

- `200` success
- `400` invalid data
- `401` invalid auth
- `500` backend failure

---

# Prototype Notes for the UI

This contract is sufficient for an initial working prototype.

Use the example payloads in this document for local/mock development. The UI should assume the backend can be swapped later, as long as the response structure remains compatible.

The Admin page should only display data the backend sends. It should not infer missing server state or errors on its own.

# Implementation Constraints

- Use `X-Admin-Password` header for auth
- Do not store password in localStorage, sessionStorage, cookies, or URL params
- Require confirmation before `start` or `restart`
- Do not automatically poll the API
- Do not auto-restart after mod changes
- Use `restart_required` from backend to show restart banners
- Do not persist admin auth state
- Clear password and reset state on `401`
- Keep the Admin page simple and card-based
