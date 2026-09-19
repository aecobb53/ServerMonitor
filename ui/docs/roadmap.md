# Roadmap

## Document Purpose

This document is the execution plan for the Friendly Neighborhood Server Monitor project.

Unlike the other project documentation, this file is expected to change frequently as the project evolves.

Its primary audience is **AI development assistants**.

An AI should be able to read this document, determine the current state of the project, implement the next logical piece of work, update this document, and stop.

The project should always remain in a functional state after completing any task.

---

# How To Use This Document

## For Human Contributors

* Review and adjust priorities as the project evolves.
* Mark completed work.
* Add new tasks when necessary.
* Keep this document synchronized with the repository.

## For AI Contributors

Unless explicitly instructed otherwise:

1. Read `architecture.md`.
2. Read `ui_style.md`.
3. Read `api.md`.
4. Read the documentation referenced by the current task.
5. Implement **one task only**.
6. Update documentation if required.
7. Mark the completed task.
8. Stop.

Do not begin the next task unless requested.

---

# Task Status

Use the following status values.

```text
☐ Not Started

◐ In Progress

☑ Complete

⚠ Blocked
```

---

# Effort Estimates

Effort estimates are intentionally approximate.

| Size | Description                                |
| ---- | ------------------------------------------ |
| XS   | Less than one short AI session             |
| S    | One normal AI session                      |
| M    | Multiple AI sessions                       |
| L    | Large feature requiring several iterations |

If a task becomes too large, it should be divided into additional implementation tasks.

---

# Current Progress

Current Phase:

**Phase 4**

Current Task:

**Task 4.1 - Authentication**

# Phase 1 - Minimum Viable Community Hub

## Goal

Build the foundational UI architecture and the minimum set of pages required to make the application useful.

At the completion of this phase users should be able to:

* Navigate the application.
* View available servers.
* View server status.
* Access individual server pages.
* Experience a polished, consistent UI foundation.

---

## Task 1.1 - Project Foundation

Status: ☑ Complete

Effort: M

### Dependencies

None.

### Objectives

Create the frontend foundation.

### Deliverables

* Create the UI project.
* Configure routing.
* Configure the global application layout.
* Configure shared styling.
* Configure API communication.
* Configure project structure.
* Verify development environment.

### Completion Checklist

* Application runs successfully.
* Routing functions correctly.
* Layout is reusable.
* Documentation updated.

---

## Task 1.2 - Navbar

Status: ☑ Complete

Effort: S

### Dependencies

Task 1.1

### Objectives

Implement the primary application navigation.

### Deliverables

* Navbar
* Navigation links
* Active page highlighting
* Responsive behavior

### Completion Checklist

* Navbar appears on every page.
* Navigation is functional.
* Styling follows `ui_style.md`.

---

## Task 1.3 - Shared UI Components

Status: ☑ Complete

Effort: M

### Dependencies

Task 1.1

### Objectives

Create the initial reusable component library.

### Deliverables

* Button
* Card
* Page Header
* Loading State
* Error State

Future tasks should reuse these components rather than creating page-specific implementations.

---

## Task 1.4 - Server Card

Status: ☑ Complete

Effort: S

### Dependencies

Task 1.3

Reference:

`docs/components/server_card.md`

### Deliverables

Reusable Server Card component.

---

## Task 1.5 - Status Badge

Status: ☑ Complete

Effort: XS

### Dependencies

Task 1.3

Reference:

`docs/components/status_badge.md`

Supported states:

* Online
* Offline
* Updating
* Restarting
* Error

---

## Task 1.6 - News Ticker

Status: ☑ Complete

Effort: S

### Dependencies

Task 1.3

Reference:

`docs/components/ticker.md`

Initially support:

* Tips
* Announcements
* Events

---

## Task 1.7 - Home Page

Status: ☑ Complete

Effort: M

### Dependencies

* Navbar
* Server Card
* Status Badge
* News Ticker

Reference:

`docs/pages/home.md`

---

## Task 1.8 - Servers Dashboard

Status: ☑ Complete

Effort: S

### Dependencies

* Navbar
* Server Card
* Status Badge

Reference:

`docs/pages/servers_dashboard.md`

---

# Phase 2 - Server Experience

## Goal

Expand each server into a complete community landing page.

At the completion of this phase users should be able to:

* View detailed server information.
* View rotating server media.
* Create and manage community tasks.
* Better understand each server.

---

## Task 2.1 - Image Carousel

Status: ☑ Complete

Effort: S

Reference:

`docs/components/image_carousel.md`

---

## Task 2.2 - Task Card

Status: ☑ Complete

Effort: XS

Reference:

`docs/components/task_card.md`

---

## Task 2.3 - Server Page

Status: ☑ Complete

Effort: M

Dependencies:

* Image Carousel

Reference:

`docs/pages/server.md`

---

## Task 2.4 - Requests Page

Status: ☑ Complete

Effort: M

Dependencies:

* Task Card

Reference:

`docs/pages/requests.md`

---

# Phase 3 - Community Features

## Goal

Transform the application from a dashboard into a community hub.

At the completion of this phase users should be able to:

* Schedule events.
* Share media.
* Browse maps.
* Participate in the community.

---

## Task 3.1 - Event Card

Status: ☑ Complete

Effort: XS

Reference:

`docs/components/event_card.md`

---

## Task 3.2 - Gallery Card

Status: ☑ Complete

Effort: XS

Reference:

`docs/components/gallery_card.md`

---

## Task 3.3 - Events Page

Status: ☑ Complete

Effort: M

Dependencies:

* Event Card

Reference:

`docs/pages/events.md`

---

## Task 3.4 - Gallery Page

Status: ☑ Complete

Effort: M

Dependencies:

* Gallery Card

Reference:

`docs/pages/gallery.md`

---

## Task 3.5 - Maps Page

Status: ☑ Complete

Effort: S

Reference:

`docs/pages/maps.md`

---

# Phase 4 - Administration

## Goal

Provide administrative functionality while maintaining a simple experience for normal users.

---

## Task 4.1 - Authentication

Status: ☐ Not Started

Effort: M

Implement the initial password-based authentication model documented in `api.md`.

Authentication should remain replaceable without requiring UI redesign.

---

## Task 4.2 - Admin Page

Status: ☐ Not Started

Effort: M

Dependencies:

* Authentication

Reference:

`docs/pages/admin.md`

---

# Future Ideas

The following ideas are intentionally excluded from the active roadmap.

* Community Feed
* World Progress
* Mod Manager
* Server Update History
* Mobile Optimizations

These ideas should remain here until promoted into an active development phase.

---

# End of Task Checklist

When an implementation task is completed:

* Update the task status.
* Update the current task.
* Update any affected documentation.
* Verify the application builds successfully.
* Verify no existing functionality has regressed.
* Commit the work if appropriate.

The project should always remain in a deployable state.

# Completed updates

2026-07-30
Added optional quick links to Events and Requests cards with matching Server Quick Links visual style.

Implemented behavior:
* Quick links are only shown when one or more links exist.
* Event and Request create/edit forms support adding multiple quick links.
* Each quick link stores a display label and URL.
* Quick links support internal paths and external URLs.

2026-08-04
Implemented initial Polls UI.

Implemented behavior:
* Added a Polls page with list, create, edit, and response submission flows.
* Added Polls navigation entry and route integration.
* Wired frontend Polls API calls for GET, POST, PUT, and poll response create.
* Added poll response inputs for single choice, multi choice, ranked choice, availability, rating, short response, and Q&A.

2026-08-04
Improved Polls UX for results visibility and link sharing.

Implemented behavior:
* Poll cards now display result summaries directly on the list view.
* Poll response modal refreshes and shows updated results after a vote submission.
* Added Copy Link action for each poll card.
* Added deep-link support using polls?id=<poll_id> with a clear filter action.

2026-08-04
Expanded Polls result rendering and copy-link styling updates.

Implemented behavior:
* Poll cards now show type-specific result details for ranked choice, availability, rating, and text response poll types.
* Closed polls always render result content, including a no-responses message when applicable.
* Poll card Copy Link now uses icon-style action consistent with other cards.

2026-08-04
Finalized Polls backend summary payload and UI consumption.

Implemented behavior:
* Poll list responses now come with backend-generated summaries for options, ranked weighted score totals, rating averages, availability totals, and recent text responses.
* Poll cards and poll response modal now render backend summary data as the source of truth.
* Added 10-second poll refresh to keep poll cards and open poll modal results current.
* Closed polls continue showing options and results while response inputs remain disabled.


# Current running list of tiny tweaks


# Upcoming ideas

Polls
    add who is playing tonight and could even check off who is on or hopped on
maybe even a timeline of who is hopping on when or available when. Like a timeline view of availability
Guides and how to with easy links. Like a community wiki
optomize for mobile


# Current things I notice could be fixed up
- [ ] the feed should filter by game
- [ ] the carousel should filter by page as well
- [ ] Im prove the log messaging
- [ ] touch up server rules
- [x] actually implement Recent news on server page
- [x] links between page content like events to requests etc.
- [x] external links for pages
- [ ] Response order of some stuff could be better like events baesd on time, requests by urgency

# Completed updates

2026-08-04
Improved modal scroll behavior, dropdown readability, and gallery reference-link copying.

Implemented behavior:
* Event detail modal now keeps stable, visible scroll behavior for long content.
* Global dropdown option contrast is fixed (dark background with readable text).
* Gallery detail viewer now includes an icon action to copy the direct image link for reference.

2026-09-07
Implemented first-pass mobile responsiveness for scoped pages.

Implemented behavior:
* Added shared mobile foundation updates: responsive navbar hamburger menu, tighter mobile container spacing, and global horizontal overflow guards.
* Optimized Main and Servers Dashboard pages for phone widths using stacking/wrapping grids and improved text overflow handling.
* Optimized Individual Server and Events pages for mobile with stacked layouts, responsive quick-link sections, and improved modal/form behavior.
* Updated the mobile implementation checklist in `mobile_ui_style.md` with Phases 1-3 complete and Phase 4 pending visual verification.
* Verified UI compiles successfully via production build.

2026-09-07
Implemented second-pass mobile responsiveness for remaining routed pages.

Implemented behavior:
* Added responsive layout and overflow protections for Requests, Polls, Gallery, Maps, and Not Found pages.
* Improved mobile modal and form behavior on Requests, Polls, and Gallery pages (stacking, scrolling, action button layout).
* Added mobile-focused map behavior including touch/pointer panning and pinch zoom support, plus responsive legend/control layouts.
* Improved text wrapping and card usability for gallery/requests/polls content at narrow widths.
* Verified UI compiles successfully via production build.
