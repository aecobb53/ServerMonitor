# Servers Dashboard

## Document Purpose

This document defines the Servers Dashboard page.

The Servers Dashboard is the primary landing page for users who want to view the status of hosted game servers and quickly navigate to an individual server.

Unlike the Home page, this page is operational rather than community focused.

Its purpose is to answer one question:

> **Which server do I want to visit?**

The page should provide that answer within a few seconds.

---

# Page Philosophy

The Servers Dashboard is a directory.

It is **not** the destination.

Detailed information belongs on each server's Overview page.

The dashboard should remain clean, fast, and easy to scan.

Avoid adding information that does not help users determine a server's current state or decide where they want to go.

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

Game Sections

↓

Server Cards
```

The page should prioritize readability over visual complexity.

---

# Page Header

The page begins with a simple page header.

Example:

**Servers**

*View the current status of every hosted game server.*

The page header should briefly explain the purpose of the page without occupying excessive vertical space.

---

# Server Organization

Servers should be grouped by game.

Example:

```text
Valheim

[ Server ]   [ Server ]

--------------------------------

Minecraft

[ Server ]   [ Server ]

--------------------------------

Factorio

[ Server ]
```

Grouping servers by game makes the page easier to scan and allows it to grow naturally as additional games are hosted.

---

# Server Cards

Each server is represented by a reusable Server Card.

The Server Card should display:

* Server Name
* Server Image
* Status Badge
* Brief Description

Selecting a Server Card navigates to that server's Overview page.

Refer to:

`components/card.md`

---

# Ordering

Game sections should be displayed in the order provided by the backend.

Servers within each game should also follow the order supplied by the backend.

The frontend should not reorder servers.

This keeps all presentation logic centralized within the backend.

---

# Automatic Refresh

The Servers Dashboard should refresh automatically.

The refresh interval should be configurable rather than hardcoded.

The purpose of automatic refresh is to keep server status reasonably current without requiring user interaction.

The refresh mechanism should remain lightweight and unobtrusive.

Future versions may replace polling with WebSockets or Server-Sent Events without requiring changes to the page layout.

---

# Server States

Servers may report states such as:

* Online
* Offline
* Starting
* Restarting
* Updating
* Error
* Unknown

The shared Status Badge component should be used to display server state consistently throughout the application.

---

# Empty State

Games without configured servers should not be displayed.

If no servers exist at all, the page should display a friendly message indicating that no servers are currently available.

---

# Loading State

While server information is loading, the page should display an appropriate loading state rather than appearing empty.

The loading state should remain visually consistent with the rest of the application.

---

# Error Handling

If the dashboard cannot retrieve server information, the page should display a friendly error message.

The page should remain usable whenever possible.

Error presentation should follow the application's shared error handling philosophy.

---

# Performance

The Servers Dashboard should feel responsive.

The page is expected to be checked frequently by users.

The interface should avoid unnecessary animations or visual distractions.

Only the information that has changed should be updated when practical.

---

# Future Enhancements

Potential future additions include:

* Live updates using WebSockets

These enhancements should not change the overall purpose of the page.

---

# AI Development Guidelines

When implementing the Servers Dashboard:

* Follow the standard application layout.
* Reuse the shared Top Navigation component.
* Reuse the Community Feed component.
* Reuse the shared Server Card component.
* Display servers grouped by game.
* Preserve the ordering provided by the backend.
* Keep the page simple and easy to scan.
* Avoid adding additional statistics or dashboard widgets unless documented elsewhere.

When uncertain, favor simplicity over additional features.

---

# Guiding Principle

The Servers Dashboard should answer the question:

> **"Which server do I want to join?"**

Everything on the page should support that goal.

Detailed server information belongs on the individual server's Overview page, while the dashboard remains a fast, reliable directory of every hosted server.
