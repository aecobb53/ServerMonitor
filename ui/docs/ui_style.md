# UI Style Guide

## Document Purpose

This document defines the visual identity, layout philosophy, and user experience guidelines for the Friendly Neighborhood Server Monitor project.

It serves as the single source of truth for how the application should look and feel.

This document is intended for both human contributors and AI assistants. Before implementing any UI, contributors should read this document alongside `architecture.md`.

This document intentionally focuses on **design philosophy** rather than implementation details.

---

# Design Philosophy

The Friendly Neighborhood Server Monitor is **not** a corporate dashboard.

It is a community hub built by friends, for friends.

The UI should encourage players to stop by, see what's happening, get excited about upcoming events, and quickly find the information they need.

The website should feel like walking into a familiar gaming clubhouse.

It should feel:

* Welcoming
* Clean
* Game-inspired
* Comfortable
* Friendly

The interface should support the community rather than compete with it.

---

# Core Design Values

Every design decision should reinforce the following principles.

## Community First

The content is more important than the interface.

The UI exists to highlight:

* Community events
* Server information
* Shared goals
* Screenshots
* Media
* Announcements

The interface should quietly support these experiences rather than draw attention to itself.

---

## Comfortable

The site should never feel crowded.

Likewise, it should never feel empty.

Layouts should use comfortable spacing that makes information easy to scan while keeping related content visually connected.

---

## Familiar

The interface should feel immediately understandable.

Users should not have to learn how to navigate the site.

Navigation, spacing, and interactions should remain consistent throughout the application.

---

## Simple Before Clever

If two designs accomplish the same goal, choose the simpler one.

Avoid visual complexity unless it improves usability.

---

## Visual, Not Text Heavy

Images, screenshots, media, and community content should be emphasized whenever appropriate.

The project should avoid becoming a collection of text and tables.

---

# Design Inspiration

The project intentionally borrows ideas from several existing products while maintaining its own identity.

## Discord

Inspired by:

* Friendly dark theme
* Comfortable spacing
* Rounded content cards
* Clean typography
* Smooth gradients
* Simple navigation
* Overall welcoming feel

Avoid:

* Chat-focused layouts
* Dense server/channel navigation
* Replicating Discord's interface directly

---

## Steam Library

Inspired by:

* Image carousels
* Screenshot presentation
* Community-focused media
* Rich game pages

Avoid:

* Store layouts
* Product marketing
* Busy interfaces
* Excessive information density

Only pages where media is important should use image carousels.

---

## Stoat (formerly Revolt)

Inspired by:

* Rounded content panels
* Modern simplicity
* Clean organization
* Side-by-side information cards

Avoid:

* Extremely dark backgrounds
* Large uninterrupted panels of content

---

# Overall Theme

The project should use a modern dark theme.

Primary colors should be inspired by Discord while remaining unique.

The site should feel warm rather than cold.

Color should be used to guide attention rather than decorate every element.

---

# Color Philosophy

Use color intentionally.

Most of the interface should consist of dark neutral colors.

Accent colors should draw attention only to important information.

Suggested palette:

* Very dark gray backgrounds
* Slight blue or purple page gradients
* Light gray cards
* White primary text
* Muted gray secondary text
* Blue and purple accent colors
* Green success
* Yellow warning
* Red error

Exact colors may evolve over time.

Consistency is more important than exact hex values.

---

# Layout Philosophy

Desktop is the primary target.

Mobile support will be added later.

Pages should generally follow this structure.

```
Navigation

↓

Primary Focus Section

↓

Main Page Content

↓

Secondary Content

↓

Footer (optional)
```

The first section should communicate the purpose of the page immediately.

Examples include:

* Upcoming events
* Important notices
* Featured screenshots
* Server overview
* Current status

Every page should answer:

> Why am I here?

within the first few seconds.

---

# Content Width

Content should not stretch completely across very large displays.

Likewise, content should not be restricted to extremely narrow columns.

Aim for a comfortable reading width with moderate page margins.

Important content may expand to full width when appropriate.

---

# Navigation

Navigation should be placed at the top of the page.

The navigation should remain consistent throughout the application.

Preferred layout:

```
Logo / Home

Center Navigation

Important Action
```

Example:

```
Home

Servers

Gallery

Events

Maps

Admin (when permitted)
```

Future versions may introduce a persistent navigation banner.

---

# Page Layout

Pages should be assembled from reusable layout patterns.

Preferred layouts include:

## Full Width Section

Used for:

* Tables
* Image carousels
* Maps
* Primary content
* Notices

---

## Two Column Layout

Used for:

* Information cards
* Tasks
* Announcements
* Supporting content

---

## Grid Layout

Used for:

* Gallery
* Media
* Screenshot collections
* Small information cards

The grid should remain responsive as the application evolves.

---

# Cards

Cards are the primary organizational element of the interface.

Cards should:

* Have rounded corners
* Use comfortable padding
* Separate related information
* Maintain consistent spacing

Borders are optional.

Important cards may include subtle borders.

Cards should never feel heavy or oversized.

---

# Typography

Typography should prioritize readability.

Use clear visual hierarchy.

Headings should be obvious.

Body text should remain easy to scan.

Avoid excessive font sizes.

---

# Images

Images are an important part of the community experience.

Images should be used to:

* Showcase builds
* Celebrate events
* Highlight screenshots
* Share memorable moments

Images should enhance the experience without overwhelming it.

---

# Image Carousel

Image carousels should only appear on pages where they add meaningful value.

Examples:

* Home
* Overview
* Gallery

Carousels should not appear on every page.

The purpose of a carousel is to build excitement and showcase the community.

---

# News Ticker

The project includes a scrolling information ticker.

The ticker may display:

* Tips
* Community announcements
* Upcoming events
* Funny messages
* Temporary jokes
* Server notices

The ticker should feel lighthearted and fun.

It should never become distracting.

---

# Motion

The interface should remain mostly static.

Animations are intentionally limited.

Acceptable motion includes:

* Hover states
* Simple fades
* Small transitions

Avoid:

* Large animations
* Constant movement
* Parallax
* Flashing elements
* Animated backgrounds

Future revisions may introduce additional motion where appropriate.

---

# White Space

Favor generous spacing over dense layouts.

Related content should appear grouped together.

Unrelated content should have clear visual separation.

Whitespace is an organizational tool, not wasted space.

---

# Responsive Design

The project is desktop-first.

Layouts should be written with future responsiveness in mind.

Desktop usability should never be compromised solely for mobile support.

---

# Accessibility

The interface should remain accessible.

Consider:

* Readable text
* Good color contrast
* Clear navigation
* Keyboard accessibility
* Meaningful labels

Accessibility improvements should be incorporated over time.

---

# What To Avoid

Avoid the following design patterns.

* Giant hero banners
* Excessive whitespace
* Neon color palettes
* Glassmorphism
* Parallax effects
* Auto-playing video
* Flashy animations
* Giant shadows
* Nested scrolling regions
* Busy dashboards
* Overly dense tables
* UI elements that compete with the content

---

# AI Design Guidelines

When implementing UI:

* Reuse existing components.
* Favor consistency over originality.
* Build pages from existing layout patterns.
* Prioritize readability.
* Keep spacing comfortable.
* Let the content be the focal point.
* Use color intentionally.
* Do not introduce new visual styles unless documented.

When uncertain, choose the simpler implementation.

---

# Guiding Principle

The purpose of the interface is to showcase the community.

The interface should never compete with the content.

Players should remember the screenshots, events, builds, and adventures they shared—not the UI itself.
