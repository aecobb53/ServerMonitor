# Card Component

## Document Purpose

This document defines the shared design, layout, behavior, and philosophy for all card-based components within the Friendly Neighborhood Server Monitor project.

Cards are the primary building block of the user interface. They provide concise summaries of content and serve as entry points to more detailed information.

All cards should follow the styling and interaction guidelines defined here. Individual card variants should only differ in the information they display and the action performed when selected.

---

# Card Philosophy

Cards should summarize information rather than explain it.

A user should be able to quickly determine:

* What this item is.
* Whether it is relevant to them.
* What will happen if they click it.

Cards should invite interaction rather than attempt to display every available detail.

Detailed information belongs on a dedicated page or in a modal.

---

# Visual Style

All cards should share a common visual language.

Cards should:

* Have rounded corners.
* Use comfortable internal padding.
* Maintain consistent spacing.
* Follow the application's dark theme.
* Use the project's accent colors sparingly.
* Scale naturally as screen sizes change.
* Feel lightweight rather than heavy.

Cards should never become visually overwhelming.

The content should always remain the focal point.

---

# Shared Layout

Cards should generally follow the same layout.

```text
┌─────────────────────────────────────┐
│ Optional Image                      │
├─────────────────────────────────────┤
│ Title                               │
│                                     │
│ Description                         │
│                                     │
│ Supporting Information              │
│                                     │
│ Optional Status                     │
└─────────────────────────────────────┘
```

Not every card uses every section.

The order should remain consistent whenever possible.

---

# Common Elements

Cards may include any combination of the following elements.

## Image

Optional.

Images should enhance the card rather than dominate it unless the card is specifically media-focused.

---

## Title

Required unless otherwise noted.

The title should clearly identify the purpose of the card.

---

## Description

Optional.

Descriptions should remain short and easy to scan.

Avoid large blocks of text.

---

## Supporting Information

Optional.

Examples include:

* Date
* Time
* Player count
* Category
* Upload date
* Server name

Supporting information should remain visually secondary to the title and description.

---

## Status

Optional.

Status should be represented using the shared Status Badge component whenever appropriate.

Examples include:

* Online
* Offline
* Updating
* Upcoming
* Completed

---

# Interaction

Unless otherwise documented, cards are interactive.

Cards should:

* Display a hover state.
* Change the cursor when hovered.
* Support keyboard navigation.
* Support click interaction.

Cards should clearly communicate that they are interactive.

---

# Card Actions

Cards should have a single primary action.

The primary action depends on the card type.

Examples:

* Navigate to another page.
* Open a modal.
* Open a media viewer.

Additional actions may be added in the future but should remain secondary.

---

# Card Variants

The following sections describe the unique behavior and content for each card type.

---

# Server Card

## Purpose

Provide a quick overview of a game server.

The Server Card is intended to help users quickly determine the server's identity and current state.

Clicking the card navigates the user to the server's Overview page.

## Content

Required:

* Server Name
* Server Image
* Server Status
* Brief Server Description

The server image should remain relatively small and act as a visual identifier rather than the primary focus of the card.

## Interaction

Primary Action:

Navigate to the selected server's Overview page.

---

# Event Card

## Purpose

Provide a preview of an upcoming event.

The Event Card should help users quickly understand what the event is and when it will occur.

Clicking the card opens a modal containing the complete event details.

## Content

Required:

* Event Title
* Event Description
* Event Date
* Event Time

Optional:

* Event Image
* Extended Details

The optional image should support the event but should not dominate the card.

The extended details should only appear within the modal.

## Interaction

Primary Action:

Open the Event Details modal.

---

# Task Card

## Purpose

Provide a preview of a community task.

Task Cards should communicate what needs to be done without overwhelming the user with details.

Clicking the card opens a modal displaying the complete task.

## Content

Required:

* Task Title
* Task Description
* Task Content

Optional:

* Supporting Image

The task content should be brief within the card and expanded within the modal.

## Interaction

Primary Action:

Open the Task Details modal.

---

# Gallery Card

## Purpose

Provide a preview of community media.

Unlike the other card types, media is the primary focus of the Gallery Card.

Clicking the card opens a larger media viewer.

## Content

Required:

* Image or Media Preview

Optional:

* Title
* Description

The image or media should occupy the majority of the card.

Supporting text should remain secondary.

## Interaction

Primary Action:

Open the selected media in a larger viewer.

---

# AI Development Guidelines

When creating new cards:

* Reuse the shared card layout.
* Maintain consistent spacing.
* Keep visual styling consistent across all variants.
* Display only summary information.
* Allow the detailed experience to occur after interaction.
* Do not introduce new card styles unless they provide meaningful value to multiple pages.

When uncertain, extend the existing Card component rather than creating a new visual pattern.

---

# Guiding Principle

Cards are summaries, not destinations.

Their purpose is to help users quickly discover information and encourage further interaction while maintaining a clean, welcoming, and consistent user experience.
