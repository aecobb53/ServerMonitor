```markdown
# Mobile Responsiveness

## Purpose

Apply mobile responsiveness to the existing UI without redesigning it.

Use `ui_style.md` and the current page/component documentation as the source of truth for the application's design and behavior. This document only defines how that existing design should adapt to smaller screens.

The implementation should be dynamic and work with the UI that currently exists. Do not assume the pages or components described here are unchanged from earlier versions of the project.

---

## Principles

- Treat mobile as a **responsive pass**, not a separate mobile design.
- Preserve the existing visual style, information hierarchy, and functionality.
- Prefer adapting existing components over creating mobile-specific versions.
- Keep the code footprint small and use the frontend framework's responsive capabilities where possible.
- Prefer flexible layouts, wrapping, and stacking over many hardcoded breakpoints.
- Minor visual imperfections at unusual screen sizes are acceptable.
- Do not redesign desktop behavior unnecessarily.
- Avoid page-level horizontal scrolling.
- Keep interactive elements reasonably easy to use with touch.

---

## Navigation

The existing desktop navbar should collapse into a **hamburger/menu** on smaller screens.

Do not allow the desktop navigation to wrap into multiple rows.

All existing navigation options should remain accessible through the mobile menu.

The ticker, if present, should remain a single-line element and must not create horizontal page overflow.

---

## Layout

Existing page layouts should adapt naturally to the available width.

Where content is arranged horizontally on desktop:

- Allow it to wrap or stack on smaller screens.
- Keep important information visible.
- Reduce spacing or padding modestly where appropriate.
- Avoid fixed widths that cause overflow.

Cards should remain the same general components used on desktop. Modify their layout responsively rather than creating separate mobile cards.

---

## Modals and Forms

Existing modals should adapt to the smaller viewport rather than being replaced.

On mobile:

- Use most of the available screen width.
- Allow content to scroll when necessary.
- Keep close and action controls accessible.
- Ensure forms remain usable when the mobile keyboard is open.

Forms should generally become single-column layouts when space is limited.

---

## Images and Media

Images and media must remain within their containing elements.

Preserve aspect ratios unless the existing design intentionally uses cropping.

Do not distort or unnecessarily shrink important media simply to preserve a desktop layout.

---

## Gallery and Maps

### Gallery

Allow the existing gallery layout to reduce its number of columns as space decreases.

Preserve the existing gallery behavior and backend-provided layout decisions where practical, but simplify spans when necessary to fit smaller screens.

### Maps

Maps should remain large enough to be useful.

Do not attempt to fit an entire large map into a phone viewport. Preserve the existing pan, zoom, reset, and fullscreen functionality and ensure the map does not cause page overflow.

---

## Breakpoints

Do not build the application around many device-specific breakpoints.

Prefer responsive CSS/layout behavior that naturally adapts to available space. Use the frontend framework's responsive utilities where available.

Only introduce explicit breakpoints when the existing layout genuinely needs a change in structure.

---

## Implementation Constraints

Before changing code:

1. Inspect the current UI and existing documentation.
2. Identify existing responsive behavior and reusable components.
3. Make the smallest changes necessary.
4. Reuse existing components and styling.
5. Do not introduce a separate mobile application, routing system, or component hierarchy.
6. Do not modify `ui_style.md` as part of this work.
7. Do not add unrelated features or redesign existing pages.

The current implementation takes precedence over assumptions made in this document.

---

## Definition of Done

Mobile responsiveness is complete when:

- The site works at normal phone widths without accidental horizontal scrolling.
- The navbar becomes a hamburger/menu.
- Existing pages and components remain functional.
- Cards, forms, and modals adapt to available space.
- Text and images do not overflow their containers.
- Gallery content remains useful on small screens.
- Maps remain usable on touch devices.
- Important functionality is not hidden merely because the screen is smaller.
- Desktop remains substantially unchanged.
- The implementation remains simple enough for an AI to easily understand and maintain.

---

## Approved First-Pass Scope

This first implementation pass is intentionally limited to:

- Main page
- Servers dashboard page (all servers list/status)
- Individual server page (single server detail)
- Events page

All other pages are explicitly out of scope for this pass unless a shared global change is required.

---

## Execution Flow For This Pass

Implement in this order to minimize risk and keep changes reviewable.

### Phase 1: Shared Foundation

Apply global responsive fixes used by all scoped pages:

- Navbar collapses to hamburger/menu at small widths.
- Prevent page-level horizontal overflow.
- Container spacing and horizontal padding scale down on mobile.
- Ticker remains single-line and does not force overflow.

### Phase 2: Main + Servers Dashboard

Adapt page-level layouts and cards:

- Main page sections remain in current order and stack cleanly.
- Featured area and quick navigation adapt to narrow widths.
- Servers dashboard content remains readable without full-page horizontal scroll.

### Phase 3: Individual Server + Events

Adapt detail-heavy layouts and interactive surfaces:

- Individual server sections stack and wrap naturally.
- Quick links remain easy to tap and do not overflow.
- Events cards and modal content become mobile-friendly while preserving behavior.

### Phase 4: Verification Pass

Verify both mobile and desktop behavior before stopping:

- Mobile widths: no accidental horizontal scrolling.
- Desktop widths: no significant visual regression.
- Targeted pages remain fully functional.

---

## Resume And Handoff Protocol

If work is interrupted and resumed in a new AI chat:

1. Reload this document, `ui_style.md`, and `api.md` first.
2. Read current UI components/pages before making assumptions.
3. Continue from the first unchecked item in the Progress Checklist below.
4. Preserve existing edits unless they clearly violate this document.
5. Keep changes incremental and avoid combining multiple phases in one large edit.

When a phase is completed, update the checklist in this file immediately.

---

## Progress Checklist

- [x] Phase 1 complete: shared foundation
- [x] Phase 2 complete: main page + servers dashboard
- [x] Phase 3 complete: individual server page + events page
- [ ] Phase 4 complete: verification at mobile and desktop widths

---

## Guardrails For Future Sessions

- Do not create separate mobile-only components unless adaptation is impossible.
- Do not add unrelated redesigns while doing responsive work.
- Prefer framework responsive utilities before custom CSS.
- Favor readability and maintainability over pixel-perfect behavior at every width.
- If a tradeoff is required, preserve function and content first, then visual polish.

---

## Second-Pass Scope Completed

A follow-up responsive pass has been implemented for the remaining routed pages and related shared components:

- Requests page
- Polls page
- Gallery page
- Maps page
- Not Found page
- Shared gallery card and map interaction behavior

This means responsive implementation work is now present across all current routes.

Verification status after this pass:

- TypeScript + production build: passing
- Final manual viewport QA: still recommended before marking overall mobile work fully complete
```
