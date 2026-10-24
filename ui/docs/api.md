# API Guide

## Document Purpose

This document defines the communication contract between the backend and frontend of the Friendly Neighborhood Server Monitor project.

Its purpose is to establish a consistent API philosophy, communication standards, and development guidelines.

This document intentionally does **not** document individual endpoints. Endpoint-specific documentation may be added later under `docs/api/` if the project grows large enough to justify it.

If guidance in this document conflicts with endpoint-specific documentation, this document takes precedence.

---

# API Philosophy

The API is the single communication layer between the frontend and the backend.

All user interactions should flow through the API.

The frontend should never communicate directly with:

* The monitor
* Docker
* Game servers
* The database
* The filesystem

The frontend communicates only with the API.

The API communicates with the remainder of the system.

```text
Browser
    │
    ▼
Frontend UI
    │
    ▼
REST API
    │
    ├──────────────► Monitor
    │
    ├──────────────► Database
    │
    ├──────────────► Docker
    │
    └──────────────► Game Servers
```

This separation keeps the frontend simple while allowing the backend implementation to evolve without affecting the UI.

---

# Source of Truth

The backend is the authoritative source of truth.

The backend owns:

* Business logic
* Validation
* Permissions
* Server state
* Data integrity

The frontend is responsible for:

* Displaying data
* Collecting user input
* Presenting errors
* Calling API endpoints

The frontend should never duplicate backend business logic.

When backend state and frontend state disagree, the backend is considered correct.

---

# API Design Principles

The API should be:

* Simple
* Predictable
* Consistent
* RESTful
* Easy for both humans and AI to consume

Resources should represent data rather than individual pages.

Examples include:

* Servers
* Tasks
* Events
* Gallery
* Maps
* Announcements

Avoid page-specific endpoints whenever practical.

---

# Authentication Philosophy

Authentication should begin intentionally simple.

Current implementation:

* Public read access
* Password-protected write operations
* Administrative functionality protected by elevated permissions

The frontend should not know how authentication is implemented.

Future authentication methods (Discord OAuth, JWT, user accounts, etc.) should be replaceable without requiring UI redesign.

---

# Standard Response Format

All API responses should follow a consistent structure whenever practical.

Successful responses:

```json
{
    "success": true,
    "data": {
        ...
    }
}
```

Failed responses:

```json
{
    "success": false,
    "error": {
        "code": "SERVER_NOT_FOUND",
        "message": "The requested server does not exist."
    }
}
```

## Success

The `success` field should always indicate whether the request succeeded.

This allows frontend code to quickly determine the result while still respecting the HTTP status code.

---

## Error Codes

Error codes should be short, predictable, and stable.

Examples:

* SERVER_NOT_FOUND
* INVALID_PASSWORD
* TASK_ALREADY_EXISTS
* EVENT_NOT_FOUND
* VALIDATION_ERROR

These codes are intended for frontend logic.

The accompanying message is intended for display to the user or logging.

---

# HTTP Status Codes

The API should use standard HTTP status codes whenever appropriate.

| Status | Meaning                                  | Typical UI Behavior                                    |
| -----: | ---------------------------------------- | ------------------------------------------------------ |
|    200 | Successful request                       | Continue normally                                      |
|    201 | Resource created                         | Show success feedback                                  |
|    204 | Successful request with no response body | No additional action                                   |
|    400 | Invalid request                          | Display validation feedback                            |
|    401 | Authentication required                  | Prompt for credentials                                 |
|    403 | Permission denied                        | Inform the user                                        |
|    404 | Requested resource not found             | Display not found message                              |
|    409 | Resource conflict                        | Inform the user of the conflict                        |
|    422 | Validation failure                       | Highlight invalid fields                               |
|    500 | Internal server error                    | Display a generic error                                |
|    503 | Service unavailable                      | Inform the user the service is temporarily unavailable |

The frontend should gracefully handle these responses.

Dedicated error pages and advanced error handling are considered future enhancements and are intentionally out of scope for the initial implementation.

---

# Request Guidelines

Requests should remain simple and predictable.

When appropriate, resources may support:

* Filtering
* Sorting
* Searching
* Pagination

These capabilities should only be added when they provide meaningful value.

Avoid unnecessary complexity.

---

# Resource Philosophy

Each resource should expose only the operations it needs.

For example:

Servers

* View status
* View information
* Administrative actions

Tasks

* Create
* Read
* Update
* Complete
* Delete (administrative)

Gallery

* Upload
* Browse
* Delete (administrative)

Resources should remain independent whenever practical.

---

# API Stability

Whenever practical:

* Add new fields rather than changing existing ones.
* Avoid renaming response properties.
* Preserve backwards compatibility.
* Deprecate functionality before removing it.

The goal is to allow the frontend to evolve without requiring frequent API redesigns.

---

# Future Enhancements

The following features are intentionally outside the scope of the initial implementation.

Potential future additions include:

* WebSockets for live updates
* Server-Sent Events (SSE)
* Discord authentication
* User accounts
* JWT authentication
* API versioning
* Rate limiting
* Request caching
* Real-time notifications

These enhancements should build upon the existing API rather than replace it.

---

# AI Development Guidelines

When implementing new endpoints:

* Follow the standard response format.
* Return appropriate HTTP status codes.
* Keep endpoint behavior predictable.
* Avoid page-specific APIs.
* Keep business logic in the backend.
* Keep authentication abstracted from the frontend.
* Reuse existing models whenever possible.

When uncertain, choose the simpler implementation.

---

# Guiding Principle

The frontend should never need to know **how** something is accomplished.

It should only know:

* What data it requested.
* Whether the request succeeded.
* What data was returned.
* What error occurred if it failed.

The backend owns everything else.

# Date and time

Date/time is returned from the backend in UTC. The UI should convert that to the local time for the browser
