# Maps

## Document Purpose

This document defines the Maps page for the Friendly Neighborhood Server Monitor project.

The Maps page serves as a reference for the community by displaying the current world map for a server.

Its purpose is to help players locate important areas, plan exploration, and understand the layout of the world.

Unlike the other pages, the Maps page is primarily informational.

Its purpose is to answer the question:

> **"Where is everything?"**

---

# Page Philosophy

The Maps page should remain intentionally simple.

The map itself is the primary feature.

The page exists to display a manually maintained community map rather than become an interactive mapping application.

The website should display the current canonical map while allowing players to easily explore it through zooming and panning.

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

Description

↓

Last Updated

↓

Legend

↓

Interactive Map
```

The map should remain the visual focus of the page.

---

# Page Header

The page begins with a simple page header.

Example:

**Map**

*Explore the world and discover important community locations.*

The header should briefly communicate the purpose of the page without occupying excessive vertical space.

---

# Description

A short description should explain the purpose of the map.

Example:

> This community map highlights major bases, portals, resource farms, and other important locations. It is updated periodically as the world evolves.

The description should remain concise.

---

# Last Updated

The page should display the date the map was last updated.

Example:

**Last Updated**

July 29, 2026

Displaying the last update helps users understand how current the map is.

---

# Legend

The page should include a simple legend describing the symbols used on the map.

Example:

```text
🏠 Main Base

⚔ Boss

🛖 Outpost

⛵ Harbor

🌾 Farm
```

The legend should remain concise and easy to understand.

Desktop implementations should display the legend beside the map whenever practical.

When viewing the map in full-screen mode, the legend may be displayed as a small overlay.

---

# Interactive Map

The map should be displayed as a high-resolution image.

Supported interactions include:

* Zoom
* Pan
* Reset View
* Full Screen

The map should remain responsive and easy to navigate.

Users should be able to inspect fine details without image distortion.

---

# Image Quality

The backend should provide the highest practical resolution available.

The frontend should preserve image quality while allowing users to zoom naturally.

Images should not be unnecessarily compressed or distorted.

---

# Full Screen

The map should support full-screen viewing.

The full-screen view should maximize the available viewing area while preserving access to:

* Zoom
* Pan
* Reset View

The legend may remain available as a small overlay while in full-screen mode.

---

# Reset View

Users should be able to restore the map to its default position and zoom level.

A simple **Reset View** control should return the map to its initial state.

---

# Filtering

The Maps page supports filtering.

Initial implementation:

* Server

Example:

```text
/maps?server=valheim-main
```

The frontend should simply request the filtered data.

Filtering logic belongs entirely to the backend.

Future versions may support multiple maps per server without changing the page layout.

---

# Map Management

Maps are maintained manually.

The intended workflow is:

1. Capture an updated in-game map.
2. Edit or annotate the image using an external image editor.
3. Upload the updated map through backend or administrative workflows.
4. Display the new map to users.

The Maps page should not become a map editor.

---

# Loading State

The page should display gracefully while the map is loading.

A loading indicator should be displayed until the map is ready for interaction.

---

# Error Handling

If the map cannot be retrieved, display a friendly error message while preserving the remainder of the page whenever possible.

Error handling should follow the shared application guidelines.

---

# Future Enhancements

Potential future additions include:

* Multiple maps per server
* Interactive map markers
* Server-defined points of interest
* Marker filtering
* Marker hover tooltips
* Download original image
* Related gallery items
* Related events

These enhancements should extend the existing page without changing its primary purpose.

---

# AI Development Guidelines

When implementing the Maps page:

* Follow the standard application layout.
* Reuse the shared Top Navigation component.
* Reuse the Community Feed component.
* Prioritize the map over supporting content.
* Preserve image quality while zooming.
* Support smooth pan and zoom interactions.
* Provide Reset View functionality.
* Support full-screen viewing.
* Keep the page intentionally simple.
* Do not implement interactive map editing.
* Do not implement user-created markers.

When uncertain, choose the simpler implementation.

---

# Guiding Principle

The Maps page exists to help players explore and navigate their world.

It should provide a clean, high-quality viewing experience that allows the community to quickly locate important places while remaining easy to maintain and straightforward to use.
