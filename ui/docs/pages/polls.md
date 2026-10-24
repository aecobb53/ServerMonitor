# Polls

## Document Purpose

This document defines the Poll system for the Friendly Neighborhood Community Hub.

Polls provide a reusable framework for collecting structured community input.

Unlike Discord conversations, Polls are persistent, organized, and tied to community resources such as Servers, Events, Requests, or future content.

Polls are independent objects.

They may exist on their own or be referenced by one or more resources throughout the application.

---

# Philosophy

Polls answer a simple question:

> **"What structured information should the community contribute?"**

A poll may collect:

* Votes
* Rankings
* Availability
* Ratings
* Short responses
* Community questions

Polls are **not** intended to replace Discord discussion.

Instead, they provide a permanent place for structured information that would otherwise be lost in chat history.

---

# Core Design Principles

* Polls are standalone objects.
* Polls may be referenced by multiple resources.
* Polls are reusable.
* Polls remain visible after closing.
* Closed polls become read-only.
* Polls preserve community history.
* The backend owns poll behavior.
* The frontend renders poll types provided by the backend.

---

# Supported Poll Types

## Single Choice

Purpose

Allow users to select exactly one option.

Examples

* Should we fight The Queen?
* Which boss next?
* Which Friday works?

Display

Embedded by default.

---

## Multi Choice

Purpose

Allow users to select multiple options.

Examples

* What materials do we still need?
* Which mods should we install?
* Which achievements should we work toward?

Display

Embedded by default.

---

## Ranked Choice

Purpose

Allow users to rank options by preference.

Duplicate rankings are allowed.

Examples

* Prioritize upcoming projects.
* Rank desired server improvements.
* Preferred games for next month.

Display

Embedded by default.

---

## Availability

Purpose

Collect one or more availability windows from each participant.

Users may submit:

* One availability window
* Multiple availability windows
* "Maybe" windows
* "Definitely Playing" windows

Each window is optional.

Examples

Friday

Definitely Playing

6:00 PM - 9:00 PM

Maybe

9:00 PM - 11:00 PM

Display

Embedded by default.

Availability should use a timeline/slider interface with 30-minute increments.

---

## Rating

Purpose

Collect a simple community rating.

Fixed five-point scale.

Examples

* Rate tonight's event.
* How difficult was this boss?
* How fun was the new mod?

Display

Embedded by default.

---

## Short Response

Purpose

Collect short free-form responses.

Maximum response length:

500 characters

Examples

* Suggested server name
* Favorite build ideas
* Feedback after an event

Display

Linked by default.

---

## Q&A

Purpose

Maintain a shared collection of community questions and answers.

Unlike the other poll types, a Q&A contains multiple questions.

Each question contains:

* Question
* Single shared community answer

Anyone may submit questions.

Anyone may update the shared answer.

Examples

* What food should we bring?
* Where is Haldor?
* How do we summon this boss?
* Frequently asked server questions

Q&A serves as a lightweight FAQ that grows over time.

Display

Linked by default.

---

# Poll Properties

Every Poll contains:

* Title
* Summary / Description
* Poll Type
* Creation Time
* Closed State
* Anonymous Responses (optional)
* Allow Vote Changes
* Response Count

---

# Poll Status

Polls support two states.

## Open

Users may submit or update responses.

Results update live.

---

## Closed

Users may no longer submit responses.

The poll becomes read-only.

Results remain permanently visible.

Closed polls preserve historical context.

---

# Editing

Polls may be edited.

The initial implementation assumes trusted users.

Minor edits such as:

* Title
* Description
* Clarifications

are expected.

The backend maintains logging should recovery ever become necessary.

---

# Poll Associations

Polls are independent objects.

They may be referenced by:

* Server
* Event
* Request
* Gallery
* Future resources

Polls are never owned by another object.

Resources simply reference Polls.

Example

Server

↓

FAQ

↓

Referenced by

* Event
* Request

---

# Display Modes

Resources may choose how Polls are presented.

Supported display modes:

## Embedded

The poll is rendered directly within the page.

Typical examples:

* Availability
* Single Choice
* Multi Choice
* Ranked Choice
* Rating

---

## Linked

The associated resource displays a simple navigation link to the Poll rather than embedding its contents.

The link should behave like the other quick navigation links used throughout the application.

Examples:

* Questions (5)
* Community Feedback
* Server FAQ
* Build Ideas

Selecting the link opens the Poll page where users can view or interact with the Poll.

Linked Polls should not display summaries, previews, or responses on the parent resource.

This keeps pages focused while allowing larger or more complex Polls to remain organized in their own dedicated location.

Typical examples:

* Q&A
* Short Response

The backend determines whether a Poll association is rendered as **Embedded** or **Linked**.

---

# Event Integration

Events commonly reference multiple Polls.

Example lifecycle:

Boss Fight

↓

Poll

Should we do this?

↓

Poll

Which Friday?

↓

Poll

Availability

↓

Event Occurs

↓

Rating Poll

How did it go?

↓

Gallery

This creates a complete historical timeline for community activities.

---

# Poll Page

The application includes a dedicated Polls page.

This page displays all Polls regardless of association.

Users may browse, search, and open Polls directly.

Resources throughout the application simply reference these existing Polls.

---

# Live Updates

Responses should update live whenever practical.

The frontend should reflect the latest state supplied by the backend.

---

# Backend Responsibilities

The backend owns:

* Poll validation
* Poll associations
* Display mode selection
* Response storage
* Anonymous handling
* Closing Polls
* Permission validation
* Response summaries

The backend remains the single source of truth.

---

# Frontend Responsibilities

The frontend is responsible for:

* Rendering Polls
* Rendering each Poll type
* Submitting responses
* Displaying live updates
* Displaying summaries
* Respecting backend display modes

The frontend should remain presentation-focused.

---

# Future Enhancements

Potential future additions include:

* Hidden results until poll closes
* Poll templates
* Rich text summaries
* Markdown support
* Image attachments
* Scheduled poll opening
* Poll expiration reminders
* Discord webhook integration
* Automatic event attendance estimation
* Advanced poll analytics

These enhancements should extend the Poll system without changing its core architecture.

---

# AI Development Guidelines

When implementing Polls:

* Treat every Poll as an independent object.
* Never assume a Poll belongs to a single resource.
* Keep Poll logic generic.
* Keep response types isolated.
* Reuse components wherever possible.
* Preserve historical data.
* Keep the frontend simple.
* Let the backend determine display behavior and associations.

When uncertain, prefer a reusable implementation over a specialized one.

---

# Guiding Principle

Polls provide structured community interaction.

They exist to organize information that would otherwise be scattered across chat, making it easier for groups of friends to coordinate activities, preserve decisions, and build shared knowledge over time without replacing Discord as the primary place for conversation.
