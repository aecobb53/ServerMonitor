# Server

## Document Purpose

This document defines the individual Server page.

The Server page is the central hub for a specific game server. It provides users with a high-level overview of the server, important information, recent activity, and links to server-specific resources.

Unlike the Servers Dashboard, which helps users choose a server, the Server page helps users understand and interact with that server.

Its purpose is to answer the question:

> **"Tell me about this server."**

---

# Page Philosophy

The Server page is the home page for an individual server.

It should introduce the server, communicate its current status, provide important information, and direct users to the appropriate server-specific resources.

The page should summarize information rather than replace dedicated pages.

Detailed information belongs within the Tasks, Events, Gallery, Maps, and Admin pages.

---

# Layout

The page follows the standard application layout.

```text
Top Navigation

↓

Community Feed

↓

Featured Carousel (Optional)

↓

Server Header

↓

Quick Info

↓

Quick Links

↓

Recent News

↓

Rules

↓

Server Logs (Collapsed)
```

The page should remain clean, informative, and easy to navigate.

---

# Featured Carousel

The Featured Carousel is optional.

When present, it should showcase memorable moments from this specific server.

Examples include:

* Community screenshots
* Major builds
* Boss victories
* Funny moments
* Featured events

If no suitable content exists, the carousel should be omitted.

Refer to:

`components/featured_carousel.md`

---

# Server Header

The Server Header immediately identifies the server.

It should include:

Required:

* Server Name
* Current Status
* Brief Server Description

Example:

```text
Valheim

🟢 Online

A long-term cooperative survival world focused on exploration,
large building projects, and relaxed weekend adventures.
```

The status should use the shared Status Badge component.

The description should communicate the personality and purpose of the server rather than technical information.

---

# Quick Info

The Quick Info section contains important server information.

Examples include:

* Game
* Current World
* Server Version
* Modpack Version
* Last Restart
* Current Uptime
* Maximum Players
* Time Zone (if applicable)

This information should remain concise and easy to scan.

Additional fields may be added over time without changing the overall layout.

---

# Quick Links

The Quick Links section provides direct access to pages related to this server.

Initially:

* Events
* Gallery
* Tasks

These links should navigate to the corresponding page with the appropriate server filter already applied.

Example URLs:

```text
/events?server=valheim-main

/gallery?server=valheim-main

/tasks?server=valheim-main
```

The frontend should use the server identifier provided by the backend when constructing these links.

Quick Links should use the shared Card component.

---

# Recent News

The Recent News section highlights recent activity related to this server.

Examples include:

* Recently completed builds
* New community projects
* Planned events
* World updates
* Community milestones
* Server announcements

Items should remain short and easy to scan.

This section should summarize activity rather than replace the Events or Tasks pages.

---

# Rules

The Rules section communicates important expectations for players.

Examples include:

* Community guidelines
* Building etiquette
* Server-specific rules
* Gameplay expectations

Rules should remain concise and easy to read.

This section is intended to be relatively static.

---

# Server Logs

The Server Logs section provides a lightweight view of recent server activity.

This section should remain **collapsed by default**.

Users may expand the section when troubleshooting or investigating recent activity.

Log entries should be displayed as plain text.

Example:

```text
▼ Server Logs

[12:41:11] World saved

[12:43:28] Andrew joined the server

[12:44:15] Boss defeated
```

Requirements:

* Display newest entries first.
* Preserve the order supplied by the backend.
* Do not parse or modify log messages.
* Display log entries exactly as received.

The purpose of this section is convenience rather than comprehensive log analysis.

---

# Loading State

The page should display gracefully while information is loading.

Individual sections may load independently whenever practical.

The page should never appear completely empty during loading.

---

# Error Handling

If one section cannot be retrieved, the remaining sections should continue functioning whenever possible.

Errors should be presented according to the application's shared error handling philosophy.

---

# Future Enhancements

Potential future additions include:

* Server performance summary
* Scheduled maintenance
* Embedded map preview
* Discord integration

These additions should support the overall purpose of the page without replacing dedicated pages.

---

# AI Development Guidelines

When implementing the Server page:

* Follow the standard application layout.
* Reuse the shared Top Navigation component.
* Reuse the Community Feed component.
* Reuse the Featured Carousel component when applicable.
* Reuse the shared Card component for Quick Links.
* Display the server status prominently.
* Keep information concise and easy to scan.
* Link to dedicated pages rather than duplicating their content.
* Keep Server Logs collapsed by default.
* Preserve backend-provided ordering wherever applicable.

When uncertain, favor summary information over detailed content.

---

# Guiding Principle

The Server page is the home page for an individual server.

It should introduce the server, communicate its current state, and guide users toward the server-specific resources they need while maintaining a clean, welcoming, and community-focused experience.
