# Home

## Document Purpose

This document defines the Home page for the Friendly Neighborhood Server Monitor project.

The Home page is the community hub of the application.

Unlike the Servers Dashboard, which is focused on operational information, the Home page exists to welcome users, build excitement, highlight recent activity, and encourage exploration of the rest of the website.

Its purpose is to answer three questions:

* What is this website?
* What's been happening recently?
* Where should I go next?

---

# Page Philosophy

The Home page should feel welcoming and alive.

It should celebrate the community rather than present operational information.

Every section of the page should encourage users to continue exploring the website.

The Home page should never become cluttered or overloaded with information.

---

# Layout

The page follows the standard application layout.

```text
Top Navigation

↓

Community Feed

↓

Featured Carousel

↓

Welcome Message

↓

What's New

↓

Navigation Cards
```

The page should remain visually engaging while maintaining comfortable spacing and simplicity.

---

# Featured Carousel

The Featured Carousel is the primary visual element of the Home page.

Its purpose is to showcase memorable moments from the community.

Examples include:

* Community screenshots
* Finished builds
* Boss victories
* Funny moments
* Event highlights
* Community announcements

The carousel should be large enough to immediately capture attention without dominating the page.

Users should be able to continue scrolling naturally without feeling like the page begins with a giant banner.

Refer to:

`components/featured_carousel.md`

---

# Welcome Message

A short welcome message should appear beneath the carousel.

The welcome message should briefly explain the purpose of the website.

Example:

> Welcome to our community hub. Stay up to date with events, projects, screenshots, and everything happening across our game servers.

The welcome message should remain concise.

---

# What's New

The What's New section highlights recent activity within the community.

This section should feel like a lightweight news feed rather than a detailed announcement board.

Examples include:

* Upcoming boss fights
* Recently completed builds
* Community milestones
* New servers
* Planned events
* Fun community updates

Items should remain short and easy to scan.

Users should quickly understand what has happened recently without reading large amounts of text.

---

# Navigation Cards

The Home page should provide prominent navigation cards linking users to the major areas of the website.

Initially these include:

* Events
* Gallery
* Requests
* Servers

Each navigation card should:

* Clearly communicate its destination.
* Include a simple icon or representative image.
* Use the shared Card design language.
* Navigate directly to its associated page.

These cards serve as the primary calls to action for the Home page.

---

# Content

The Home page should intentionally avoid displaying detailed operational information.

Examples of content that belongs elsewhere include:

* Live server status
* Task lists
* Event details
* Administrative controls
* Large data tables

The Home page should introduce these areas rather than replace them.

---

# Loading State

The page should display gracefully while content is loading.

Sections may appear independently as their content becomes available.

The page should never appear completely empty during loading.

---

# Error Handling

If one section cannot load, the remaining sections should continue to function whenever possible.

Failures within one component should not prevent the remainder of the Home page from displaying.

Error presentation should follow the application's shared error handling philosophy.

---

# Future Enhancements

Potential future additions include:

* Featured screenshot of the week
* Community spotlight
* Featured community build
* Seasonal announcements
* Holiday themes

These additions should continue supporting the overall purpose of the Home page without increasing visual complexity.

---

# AI Development Guidelines

When implementing the Home page:

* Follow the standard application layout.
* Reuse the shared Top Navigation component.
* Reuse the Community Feed component.
* Reuse the Featured Carousel component.
* Reuse the shared Card component for navigation.
* Keep the page welcoming and community focused.
* Avoid duplicating content that already exists on dedicated pages.
* Favor visual content over large blocks of text.

When uncertain, choose the simpler implementation.

---

# Guiding Principle

The Home page should make users excited to join the community before they decide where to go next.

Every section should encourage exploration, celebrate community activity, and reinforce that something interesting is always happening.
