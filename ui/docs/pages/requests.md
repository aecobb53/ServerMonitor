# Requests

## Document Purpose

This document defines the Requests page for the Friendly Neighborhood Server Monitor project.

The Requests page serves as the community request board for a server.

It allows players to ask the community for help, resources, projects, or anything else that would benefit from collaboration.

Unlike Discord, where conversations happen, the Requests page serves as the long-term record of what the community needs.

Its purpose is to answer the question:

> **"How can I help?"**

---

# Page Philosophy

The Requests page is a community bulletin board.

It is not intended to become a project management tool.

Requests should remain lightweight, easy to create, and easy to browse.

Discussion should continue in Discord while the website remains the source of truth for the request itself.

The page should encourage players to contribute without requiring complicated workflows.

---

# Layout

The page follows the standard application layout.

```text
Top Navigation

↓

Community Feed

↓

Page Header

↓

Privacy Reminder

↓

Create Request

↓

Request Cards
```

The page should remain simple, welcoming, and easy to browse.

---

# Page Header

The page begins with a simple page header.

Example:

**Requests**

*Help the community by completing requests from other players.*

The header should briefly explain the purpose of the page without occupying excessive vertical space.

---

# Privacy Reminder

A small notice should appear near the request creation area.

Its purpose is to remind users that the website is publicly accessible.

Example:

> **Privacy Reminder:** This website is accessible over the internet. Please do not include real names, addresses, passwords, or other sensitive personal information in your requests.

The reminder should remain visible but unobtrusive.

---

# Create Request

The page should provide a **Create Request** button.

Selecting the button opens a modal used to create a new request.

The creation workflow should remain intentionally simple.

Existing requests should also be editable from the request card. A small pencil action should open the same modal, prefilled with the current request details so the user can update the information in place.

Required fields:

* Server
* Title
* Requested By
* Urgency
* Description

Optional fields:

* Image

The frontend should submit the request to the backend.

The backend is responsible for:

* Validation
* Throttling
* Sanitization
* Persistence

The frontend should remain unaware of these implementation details.

---

# Request Card

Each request is displayed using the shared Card component.

Refer to:

`components/card.md`

Each card should display:

Header

* Title
* Requested By

Body

* Description (plain text)

Metadata

* Server
* Urgency

Optional

* Image

The description should preserve user-entered line breaks.

Markdown is intentionally **not** supported in the initial implementation.

Each card should also include lightweight actions for sharing and editing. The edit action should be represented by a pencil icon and should open the same form used for creating a request.

---

# Request Details

Selecting a Request Card opens a modal displaying the complete request.

The modal should display the request exactly as submitted.

Long descriptions should preserve formatting and line breaks.

The modal should also include a **Copy Link** action.

---

# Copy Link

Every request should have a permanent shareable link.

Selecting the chain-link icon copies the request URL to the user's clipboard.

Opening a shared request URL should:

* Open the Requests page.
* Locate the requested item.
* Automatically display its details.

This allows Discord conversations to reference requests while the website remains the canonical source of information.

---

# Filtering

The Requests page supports filtering.

Initial implementation:

* Server

Example:

```text
/requests?server=valheim-main
```

The frontend should simply request the filtered data.

Filtering logic belongs entirely to the backend.

Additional filters may be introduced in future versions.

---

# Ordering

The backend determines the ordering of requests.

The frontend should preserve the order provided.

Future versions may introduce additional sorting or filtering options.

---

# Urgency

Requests support three urgency levels.

* Whenever
* Soon
* Urgent

Urgency communicates the relative importance of a request but does not imply deadlines or assignments.

---

# Completion

Only active requests should be displayed.

Completed or archived requests should be filtered by the backend.

The frontend should not implement completion workflows during the initial release.

---

# Empty State

If no requests exist, display a friendly message.

Example:

> Nothing has been requested yet.

> Be the first to ask the community for help!

The page should encourage participation rather than feel empty.

---

# Loading State

The page should display gracefully while requests are loading.

The page should never appear completely empty during loading.

---

# Error Handling

If requests cannot be retrieved, display a friendly error message while preserving the remainder of the page whenever possible.

Error handling should follow the shared application guidelines.

---

# Future Enhancements

Potential future additions include:

* Shopping list request template
* Checkable resource lists
* Additional request templates
* Request editing
* Completion workflow
* Request history
* User accounts
* Additional filtering
* Search

These enhancements should build upon the existing request model rather than replace it.

---

# AI Development Guidelines

When implementing the Requests page:

* Follow the standard application layout.
* Reuse the shared Top Navigation component.
* Reuse the Community Feed component.
* Reuse the shared Card component.
* Keep request creation simple.
* Preserve line breaks within request descriptions.
* Do not render Markdown.
* Do not implement completion workflows.
* Do not duplicate Discord discussion features.
* Preserve backend-provided ordering and filtering.

When uncertain, choose the simpler implementation.

---

# Guiding Principle

The Requests page is a community bulletin board.

Its purpose is to make it easy for players to ask for help and equally easy for others to discover meaningful ways to contribute, while allowing Discord to remain the place where conversations happen.
