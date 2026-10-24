# Events

## Document Purpose

This document defines the Events page for the Friendly Neighborhood Server Monitor project.

The Events page serves as the community planning board for each server.

It allows players to organize boss fights, building sessions, exploration nights, community gatherings, and any other planned activities.

Unlike the Requests page, which asks **"How can I help?"**, the Events page answers:

> **"When should I show up?"**

The Events page should encourage players to participate in the community without replacing Discord as the primary place for conversation.

---

# Page Philosophy

The Events page is intended to help players plan future activities.

It is not intended to become a calendar application.

Discussion should continue in Discord while the website remains the source of truth for event information.

The page should make upcoming activities easy to discover while remaining simple and easy to maintain.

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

Create Event

↓

Event Cards
```

The page should remain clean, welcoming, and easy to browse.

---

# Page Header

The page begins with a simple page header.

Example:

**Events**

*Plan your next adventure with the community.*

The header should briefly explain the purpose of the page without occupying excessive vertical space.

---

# Create Event

The page should provide a **Create Event** button.

Selecting the button opens a modal used to create a new event.

The creation workflow should remain intentionally simple.

Existing events should also be editable from the event card. A small pencil action should open the same modal, prefilled with the current event details so the user can update the information in place.

Required fields:

* Server
* Title
* Description

Optional fields:

* Date
* Start Time
* End Time
* Meetup Location
* Expanded Details
* Image

The frontend should submit the event to the backend.

The backend is responsible for:

* Validation
* Throttling
* Sanitization
* Persistence

The frontend should remain unaware of these implementation details.

---

# Event Card

Each event is displayed using the shared Card component.

Refer to:

`components/card.md`

The Event Card should use a horizontal layout.

The event image should occupy the left side of the card while the remaining content appears to the right.

Example:

```text
┌─────────────────────────────────────────────────────────────┐
│ ┌───────────────┐  Friday Boss Fight                        │
│ │               │                                           │
│ │               │  Defeat The Queen together.               │
│ │               │                                           │
│ │               │  Friday, August 14                        │
│ │               │  8:00 PM MDT                              │
│ │               │                                           │
│ └───────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

Each card should display:

Required:

* Title
* Description
* Game
* Server Name

Optional:

* Event Image
* Date
* Time
* Meetup Location
* Expanded Details

The image should remain visually important without overwhelming the card.

Each card should also include lightweight actions for sharing and editing. The edit action should be represented by a pencil icon and should open the same form used for creating an event.

---

# Event Details

Selecting an Event Card opens a modal displaying the complete event.

The modal should include:

* Title
* Description
* Game
* Server
* Date
* Time
* Meetup Location
* Optional Image

The modal should also include an expandable **Event Details** section.

This section should remain collapsed by default.

Example uses include:

* Things to bring
* Preparation notes
* Strategy
* Meeting instructions
* Additional information

The expanded section should preserve user-entered line breaks.

Markdown is intentionally **not** supported during the initial implementation.

---

# Date and Time

Events support flexible scheduling.

Supported combinations include:

* Date only
* Date with start time
* Date with start and end time
* No date or time (planning purposes)

This allows players to begin planning activities before a final schedule has been chosen.

---

# Time Zone Handling

All dates and times returned by the backend should be in UTC.

The frontend is responsible for converting every displayed timestamp into the browser's local timezone.

This behavior should remain consistent throughout the entire application.

---

# Copy Link

Every event should have a permanent shareable link.

Selecting the chain-link icon copies the event URL to the user's clipboard.

Opening a shared event URL should:

* Open the Events page.
* Locate the requested event.
* Automatically display its details.

This allows Discord conversations to reference events while the website remains the canonical source of event information.

---

# Filtering

The Events page supports filtering.

Initial implementation:

* Server

Example:

```text
/events?server=valheim-main
```

The frontend should simply request the filtered data.

Filtering logic belongs entirely to the backend.

Additional filters may be introduced in future versions.

---

# Ordering

The backend determines the ordering of events.

Events should be returned in chronological order, with the soonest upcoming events appearing first.

The frontend should preserve the order provided.

---

# Displayed Events

The frontend should only display upcoming events returned by the backend.

Filtering past events is the responsibility of the backend.

The frontend should not determine whether an event has expired.

---

# Empty State

If no upcoming events exist, display a friendly message.

Example:

> No upcoming events are currently scheduled.

> Be the first to organize the next adventure!

The page should encourage participation rather than feel empty.

---

# Loading State

The page should display gracefully while events are loading.

The page should never appear completely empty during loading.

---

# Error Handling

If events cannot be retrieved, display a friendly error message while preserving the remainder of the page whenever possible.

Error handling should follow the shared application guidelines.

---

# Future Enhancements

Potential future additions include:

* Calendar integration
* Recurring events
* Event reminders
* RSVP support
* Attendance tracking
* Past event archive
* Search
* Additional filtering

These enhancements should build upon the existing event model rather than replace it.

---

# AI Development Guidelines

When implementing the Events page:

* Follow the standard application layout.
* Reuse the shared Top Navigation component.
* Reuse the Community Feed component.
* Reuse the shared Card component.
* Use the horizontal Event Card layout.
* Convert UTC timestamps to the browser's local timezone.
* Preserve backend-provided ordering and filtering.
* Preserve line breaks within the expanded details section.
* Do not render Markdown.
* Do not implement RSVP functionality.
* Do not implement calendar integration.
* Keep the page focused on planning future community activities.

When uncertain, choose the simpler implementation.

---

# Guiding Principle

The Events page exists to help the community plan adventures together.

It should make upcoming activities easy to discover, easy to share, and easy to participate in while allowing Discord to remain the place where conversations happen.
