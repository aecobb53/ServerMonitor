# Featured Carousel

## Document Purpose

This document defines the Featured Carousel component used throughout the Friendly Neighborhood Server Monitor project.

The Featured Carousel is a reusable component designed to showcase exciting, visually engaging community content.

Its purpose is to draw attention, build excitement, and encourage exploration of the website.

The carousel should **complement** the page rather than become its primary focus.

---

# Component Philosophy

The Featured Carousel is intended to highlight moments worth sharing.

It is not intended to communicate critical information.

Users should enjoy browsing the carousel, but they should never be required to use it to understand the page.

Important information should always exist elsewhere on the page.

The carousel exists to celebrate the community.

---

# Appropriate Uses

The Featured Carousel should only appear on pages where visual content adds value.

Examples include:

* Home
* Server Overview
* Gallery

Most pages should **not** contain a carousel.

If a carousel does not improve the page, it should be omitted.

---

# Supported Content

Each slide may contain:

Required:

* Image

Optional:

* Title
* Subtitle
* Short Description
* Click Action

Examples include:

* Community screenshots
* Base tours
* Boss victories
* Funny moments
* Community announcements
* Featured builds
* Event highlights

Future versions may support additional media types.

---

# Layout

The carousel should span the width of the page's content container.

It should not extend edge-to-edge across the browser window.

The carousel should appear as a single large content section.

Example:

```text
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                      Featured Image                           │
│                                                               │
│  Title                                                       │
│  Optional Subtitle                                           │
│                                                              │
│  ◀                                  ● ○ ○ ○              ▶    │
└───────────────────────────────────────────────────────────────┘
```

The image should remain the primary visual focus.

Text should support the image rather than compete with it.

---

# Behavior

The carousel supports both automatic and manual navigation.

Automatic rotation should:

* Advance at a comfortable interval.
* Pause while the user is interacting with the carousel.
* Resume after interaction has ended.

Manual navigation should include:

* Previous
* Next
* Slide indicators

Navigation controls should remain visually subtle.

---

# Images

Images should:

* Be high quality.
* Be community focused.
* Fill the available display area.
* Maintain their aspect ratio.
* Scale gracefully across different screen sizes.

Images should not become distorted.

---

# Text Overlay

Titles and descriptions should remain concise.

The carousel is intended to encourage exploration rather than replace the underlying page content.

Long paragraphs should be avoided.

---

# Interaction

Entire slides may be clickable.

Click actions are optional.

Possible actions include:

* Open Gallery
* Open Event
* Open Server Overview
* Open External Resource

If no action exists, the slide should simply display its content.

---

# Configuration

The component should support simple configuration.

Suggested configurable properties include:

* Auto Rotation Enabled
* Rotation Interval
* Manual Navigation Enabled
* Slide Indicators Enabled
* Maximum Number of Slides

Future options may be added as the project grows.

---

# Accessibility

The carousel should remain usable without relying solely on automatic rotation.

Users should be able to:

* Navigate manually.
* Pause interaction.
* Read all displayed text.

Images should include meaningful alternative text whenever possible.

---

# Future Enhancements

Potential future improvements include:

* Animated GIF support
* Short video clips
* Featured community builds
* Event countdown overlays
* Server-specific featured content
* Discord integration for automatic highlights

These enhancements should build upon the existing component rather than replace it.

---

# AI Development Guidelines

When implementing the Featured Carousel:

* Keep the implementation simple.
* Prioritize the image over decorative effects.
* Use smooth but subtle transitions.
* Avoid distracting animations.
* Reuse this component across all applicable pages.
* Do not create page-specific carousel implementations.

When uncertain, favor readability and simplicity over visual complexity.

---

# Guiding Principle

The Featured Carousel should create excitement without demanding attention.

It exists to showcase memorable moments from the community and encourage players to explore what their friends have been building, discovering, and experiencing together.
