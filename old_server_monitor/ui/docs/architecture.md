# Architecture

## Document Purpose

This document defines the architectural principles and organization of the Friendly Neighborhood Server Monitor project.

It is intended to be the primary reference for both human contributors and AI assistants. It describes **how the project is structured**, **how different parts communicate**, and **the guiding principles behind architectural decisions**.

This document intentionally avoids implementation-specific details such as API schemas, UI styling, or technology-specific code. Those belong in their respective documentation.

If guidance conflicts between documents, **this document takes precedence.**

---

# Project Vision

The Friendly Neighborhood Server Monitor is a community hub built around a collection of privately hosted game servers.

The goal is **not** to replace Discord.

Discord remains the primary platform for communication, conversation, voice chat, and notifications.

Instead, this project supplements Discord by providing a centralized place for:

* Server information
* Community planning
* Shared tasks
* Events
* Media
* Server administration
* Community history

The website should encourage players to check in regularly, stay informed, and feel connected to the community.

---

# Project Goals

The project should always prioritize the following goals.

## Community First

Every feature should improve the experience of the community rather than simply expose technical information.

Ask:

> Does this make it easier or more enjoyable for friends to play together?

If the answer is no, reconsider whether the feature belongs.

---

## Simplicity

The project intentionally favors simple solutions over clever ones.

Simple software is:

* Easier to maintain
* Easier for AI to extend
* Easier for contributors to understand
* Easier to debug

Avoid unnecessary abstraction until it provides meaningful value.

---

## Consistency

Users should never need to learn how each page works independently.

Pages should:

* Follow similar layouts
* Reuse components
* Share navigation
* Behave consistently

Consistency is more important than uniqueness.

---

## Extensibility

Adding support for a new game should require minimal changes.

New features should integrate into the existing architecture rather than creating parallel systems.

The project should grow through extension rather than replacement.

---

# High-Level Architecture

The application is composed of three primary systems.

```
Game Servers
      │
      ▼
+----------------+
|    Monitor     |
+----------------+
      │
      ▼
Structured Data
      │
      ▼
+----------------+
|      API       |
+----------------+
      │
      ▼
+----------------+
|       UI       |
+----------------+
      │
      ▼
      Users
```

Each system has a clearly defined responsibility.

---

# System Responsibilities

## Monitor

The monitor observes game servers and converts raw server information into structured data.

Responsibilities include:

* Monitoring server health
* Parsing logs
* Tracking player activity
* Detecting errors
* Producing structured state

The monitor **never communicates directly with the UI**.

Its only responsibility is collecting information.

---

## API

The API acts as the single communication layer between the backend and the frontend.

Responsibilities include:

* Exposing structured data
* Authentication
* Validation
* Permissions
* CRUD operations
* Business logic

The API owns all user interaction with backend data.

---

## UI

The UI is responsible only for presenting information and collecting user input.

Responsibilities include:

* Rendering pages
* Displaying data
* Collecting form input
* Calling API endpoints
* Providing a friendly user experience

The UI should never contain business logic.

---

# Data Flow

Information should always move in one direction.

```
Game Server

↓

Monitor

↓

API

↓

UI

↓

User
```

User actions travel back through the same path.

```
User

↓

UI

↓

API

↓

Game Server
```

The UI should never communicate directly with the monitor or game servers.

---

# Separation of Responsibilities

Each layer owns a specific concern.

| Layer   | Owns                                         |
| ------- | -------------------------------------------- |
| Monitor | Observing and parsing servers                |
| API     | Data validation, permissions, business logic |
| UI      | Presentation and interaction                 |

Business logic should exist only once.

Whenever possible, place it in the API rather than duplicating logic across clients.

---

# Component Philosophy

The frontend should be built from reusable components.

Pages should assemble components rather than creating one-off implementations.

Examples include:

* Server Card
* Event Card
* Task Card
* Gallery Card
* Image Carousel
* News Ticker
* Status Badge

If a visual pattern appears multiple times, it should become a reusable component.

---

# Page Philosophy

Pages exist to solve user problems.

Each page should have one clearly defined purpose.

Avoid combining unrelated functionality onto a single page.

When adding new pages, ask:

* Who is this page for?
* What question does it answer?
* Does another page already solve this problem?

---

# Backend Philosophy

The backend should expose resources rather than pages.

Good examples:

* Servers
* Tasks
* Events
* Gallery
* Maps

Avoid creating endpoints that exist solely for one page.

Pages should assemble information from reusable resources.

---

# Permissions Philosophy

Permissions should remain intentionally simple.

Initially:

* Public read access
* Password-protected write access
* Administrative functionality hidden from normal users

Authentication and authorization should remain abstracted behind the API so stronger authentication methods can be introduced later without changing the UI.

---

# Documentation Philosophy

Documentation is considered part of the project.

Every major feature should be documented before implementation.

Documentation should describe:

* Purpose
* Behavior
* Responsibilities
* Future considerations

Implementation details belong in source code, not documentation.

---

# AI Development Guidelines

This project is expected to be developed with significant AI assistance.

AI contributors should follow these principles:

* Read the relevant documentation before writing code.
* Reuse existing components whenever possible.
* Prefer extending existing systems over introducing new ones.
* Avoid duplicate functionality.
* Keep implementations simple and maintainable.
* Follow documented architecture even if another implementation appears easier.

When uncertain, favor consistency over novelty.

---

# Future Growth

This architecture is intentionally designed to support future enhancements, including:

* Additional games
* Discord integration
* Rich media support
* User accounts
* Improved authentication
* Additional administrative tools
* Mobile optimization

Future work should build upon the existing architecture rather than replacing it.

---

# Out of Scope

The project is **not** intended to become:

* A Discord replacement
* A social media platform
* A general-purpose CMS
* A complex enterprise monitoring solution

The focus should remain on supporting a small gaming community with useful tools and an enjoyable user experience.
