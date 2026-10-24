# Top Navigation

## Document Purpose

This document defines the shared top navigation component used throughout the Friendly Neighborhood Server Monitor project.

The navigation bar is displayed on every page of the application and serves as the primary navigation mechanism.

Its purpose is to provide a simple, consistent, and familiar way for users to move throughout the website.

---

# Navigation Philosophy

The navigation bar should remain simple.

Users should always know:

* Where they are.
* How to return home.
* How to reach the major sections of the website.

The navigation should never become crowded or distracting.

Additional pages should only be added when they represent a primary destination within the application.

---

# Layout

The navigation bar spans the width of the browser window and remains fixed at the top of every page.

The navigation is divided into three logical sections.

```text
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  <Logo> Server Monitor     Events  Gallery  Requests       Servers    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

# Left Section

The left section represents the identity of the application.

Contents:

* Project icon or favicon
* "Server Monitor"

Selecting this area always returns the user to the Home page.

The project icon should be easily replaceable in the future without requiring changes to the layout.

---

# Center Section

The center section contains the primary community pages.

Initially:

* Events
* Gallery
* Requests

Additional pages may be added in the future if they become core parts of the application.

Navigation items should remain evenly spaced and easy to scan.

---

# Right Section

The right section contains the Servers Dashboard.

This is intentionally separated from the community pages.

The Servers Dashboard represents the operational side of the application while the center navigation focuses on community content.

Selecting **Servers** navigates to the Servers Dashboard.

---

# Active Navigation

The currently selected page should be visually distinguished from the other navigation items.

Possible indicators include:

* Accent color
* Underline
* Increased brightness

Only one navigation item should appear active at a time.

---

# Behavior

The navigation bar should:

* Remain visible while scrolling.
* Maintain a consistent height.
* Appear on every page.
* Provide immediate access to all major areas of the application.

Navigation should feel instant and predictable.

---

# Styling

The navigation should follow the global design language defined in `ui_style.md`.

General styling includes:

* Dark background
* Subtle gradient when appropriate
* Comfortable horizontal spacing
* Rounded interactive elements where appropriate
* Consistent typography
* Minimal visual clutter

The navigation should feel clean and welcoming rather than technical.

---

# Responsiveness

The initial implementation is desktop-first.

The desktop layout should remain the primary focus.

Future mobile implementations may replace the center navigation with a collapsible menu or similar solution.

Desktop usability should not be compromised solely to support mobile devices.

---

# Future Expansion

The navigation is intentionally designed to allow future additions without requiring significant redesign.

Potential future additions include:

* Maps
* Community
* User Profile
* Notifications

Administrative functionality should **not** appear in the primary navigation.

Admin pages should only be accessible to authorized users through dedicated administrative workflows.

---

# AI Development Guidelines

When implementing the navigation:

* Use the same navigation component on every page.
* Keep spacing consistent.
* Highlight the active page.
* Keep the layout simple.
* Avoid introducing additional navigation items unless documented.
* Reuse this component throughout the application rather than creating page-specific navigation.

---

# Guiding Principle

The navigation should disappear into the background.

Users should instinctively know where to click without needing to think about how the site is organized.

The navigation exists to support the content—not compete with it.
