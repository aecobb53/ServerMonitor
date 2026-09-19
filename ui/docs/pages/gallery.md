# Gallery

## Document Purpose

This document defines the Gallery page for the Friendly Neighborhood Server Monitor project.

The Gallery serves as the community scrapbook for each server.

It allows players to share screenshots, GIFs, and memorable moments from their adventures.

Unlike the Requests page, which asks **"How can I help?"**, or the Events page, which asks **"When should I show up?"**, the Gallery answers:

> **"What have we accomplished together?"**

The Gallery exists to celebrate the community and preserve memorable moments.

---

# Page Philosophy

The Gallery is image-first.

Its purpose is to showcase community experiences rather than communicate operational information.

The page should feel enjoyable to browse while remaining clean and organized.

Discussion should continue in Discord while the Gallery serves as the long-term home for memorable screenshots and media.

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

Upload Media

↓

Gallery Grid
```

The Gallery should prioritize visual content over text.

---

# Page Header

The page begins with a simple page header.

Example:

**Gallery**

*Relive the adventures, victories, and memorable moments shared by the community.*

The header should briefly communicate the purpose of the page without occupying excessive vertical space.

---

# Upload Media

The page should provide an **Upload Media** button.

Selecting the button opens a modal used to create a new gallery entry.

Required fields:

* Server
* One or more Images or GIFs

Optional fields:

* Title
* Description

The frontend should submit the gallery entry to the backend.

The backend is responsible for:

* Validation
* Throttling
* Sanitization
* Persistence

The frontend should remain unaware of these implementation details.

---

# Gallery Grid

Gallery entries should be displayed using an Imgur-inspired grid layout.

The layout should remain organized while allowing larger media items to naturally create visual interest.

Most gallery items should occupy a standard grid cell.

Some gallery items may span additional rows or columns.

The backend determines the grid size based on the uploaded media.

The frontend should simply render the layout provided.

The overall layout should remain orderly rather than chaotic.

---

# Gallery Card

Each gallery entry is displayed using the shared Card component.

Refer to:

`components/card.md`

The Gallery Card should prioritize the media.

The first uploaded image or GIF should be used as the card preview.

If multiple media files exist, the card should display a small media count indicator.

Example:

```text
□□□□□□□□□□□□□□□□□□□□

Castle Complete

8 Images
```

Each Gallery Card should display:

Required:

* Media Preview

Optional:

* Title
* Description

Metadata:

* Server
* Media Count (when applicable)

The preview image should occupy the majority of the card.

Text should remain visually secondary.

---

# Gallery Details

Selecting a Gallery Card opens a modal displaying the complete gallery entry.

The modal should include:

* Full-size media viewer
* Title
* Description
* Server

If multiple images or GIFs exist, users should be able to navigate between them within the modal.

Navigation should remain simple and intuitive.

---

# Supported Media

Initial implementation supports:

* Images
* GIFs

Videos are intentionally not supported during the initial implementation.

Future support for additional media types may be added without changing the overall page design.

---

# Copy Link

Every gallery entry should have a permanent shareable link.

Selecting the chain-link icon copies the gallery URL to the user's clipboard.

Opening a shared gallery URL should:

* Open the Gallery page.
* Locate the requested gallery entry.
* Automatically display its media viewer.

This allows Discord conversations to reference gallery entries while the website remains the canonical source of shared media.

---

# Filtering

The Gallery supports filtering.

Initial implementation:

* Server

Example:

```text
/gallery?server=valheim-main
```

The frontend should simply request the filtered data.

Filtering logic belongs entirely to the backend.

Additional filters may be introduced in future versions.

---

# Ordering

The backend determines the ordering of gallery entries.

The frontend should preserve the order provided.

Future versions may introduce additional sorting or filtering options.

---

# Image Handling

The Gallery should preserve uploaded media whenever possible.

Images should not be unnecessarily cropped or distorted.

The backend determines the preferred display size for each gallery entry.

The frontend should render the provided layout without additional layout decisions.

---

# Empty State

If no gallery entries exist, display a friendly message.

Example:

> No screenshots have been shared yet.

> Go create something worth remembering!

The page should encourage participation rather than feel empty.

---

# Loading State

The page should display gracefully while media is loading.

The page should never appear completely empty during loading.

Media should load progressively whenever practical.

---

# Error Handling

If gallery entries cannot be retrieved, display a friendly error message while preserving the remainder of the page whenever possible.

Error handling should follow the shared application guidelines.

---

# Future Enhancements

Potential future additions include:

* Video support
* Media search
* Additional filtering
* Slideshow mode
* Infinite scrolling
* Related Events
* Related Requests
* Media reactions

These enhancements should build upon the existing Gallery model rather than replace it.

---

# AI Development Guidelines

When implementing the Gallery page:

* Follow the standard application layout.
* Reuse the shared Top Navigation component.
* Reuse the Community Feed component.
* Reuse the shared Card component.
* Prioritize media over text.
* Support multiple media uploads per gallery entry.
* Display the first uploaded image or GIF as the gallery preview.
* Display the total media count when multiple files exist.
* Preserve backend-provided ordering and filtering.
* Preserve image aspect ratios whenever practical.
* Do not implement video support.
* Keep the layout clean and visually engaging.

When uncertain, choose the simpler implementation.

---

# Guiding Principle

The Gallery exists to celebrate the community.

It should make it easy to preserve memorable moments, share accomplishments, and revisit adventures while maintaining a clean, inviting, and image-focused browsing experience.
