# Community Feed (Ticker)

## Document Purpose

This document defines the Community Feed (Ticker) component used throughout the Friendly Neighborhood Server Monitor project.

The Community Feed is a simple scrolling line of text displayed beneath the site's top navigation.

Its purpose is to make the application feel active by surfacing fun, interesting, and timely information from the community.

The ticker should remain lightweight, unobtrusive, and easy to ignore if users are focused on other content.

---

# Component Philosophy

The Community Feed exists to make the site feel alive.

It is not intended to replace announcements, notifications, or page content.

If a message is important enough that every user must see it, it should also appear elsewhere on the page.

The ticker should reward users for checking in without demanding their attention.

---

# Placement

The Community Feed appears directly beneath the Top Navigation.

It spans the width of the page's content container.

```text
----------------------------------------------------
Top Navigation
----------------------------------------------------

⚔ Boss fight Friday | 💡 Repair your gear | 🎉 Happy Birthday Andrew!

----------------------------------------------------

Page Content
```

The ticker should appear consistently on every page.

---

# Content

The Community Feed displays a single scrolling line of text.

Messages may include:

* Community announcements
* Upcoming events
* Gameplay tips
* Server notices
* Funny messages
* Temporary jokes
* Community milestones

The frontend should not interpret the content.

It simply displays the messages provided by the backend.

---

# Data Model

The backend should provide an ordered list of messages.

Example:

```json
[
    "⚔ Boss fight Friday at 8 PM",
    "💡 Repair your gear before sailing",
    "🎉 Happy Birthday Andrew!",
    "😂 GOOG $12,482.15 ▲ 412%"
]
```

The frontend should join the messages using the `|` character.

Example:

```text
⚔ Boss fight Friday at 8 PM | 💡 Repair your gear before sailing | 🎉 Happy Birthday Andrew! | 😂 GOOG $12,482.15 ▲ 412%
```

The backend owns the message order.

The frontend should preserve that order exactly.

---

# Behavior

The ticker should:

* Scroll continuously from right to left.
* Loop indefinitely.
* Pause while the user hovers over it.
* Resume automatically when the cursor leaves.

Scrolling should remain smooth and easy to read.

The speed should prioritize readability over animation.

---

# Styling

The Community Feed should follow the application's dark theme.

General styling should include:

* Single line of text
* Comfortable vertical padding
* Muted background
* High readability
* No unnecessary decoration

The ticker should remain visually secondary to the page's primary content.

---

# AI Development Guidelines

When implementing the Community Feed:

* Keep the implementation intentionally simple.
* Do not add categories.
* Do not add priorities.
* Do not make messages clickable.
* Do not reorder messages.
* Preserve the backend-provided order.
* Use the `|` character as the separator between messages.

The frontend's responsibility is to display the messages—not manage them.

---

# Guiding Principle

The Community Feed should quietly remind users that something is always happening.

It should add personality to the application without distracting from the community content it supports.
