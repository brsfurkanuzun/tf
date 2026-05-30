# Cinematic Sequence — Page Override

> Overrides `design-system/reverie/MASTER.md` for the pinned scroll experience.

## Context

Full-viewport WebGL canvas. UI is overlay-only — no traditional sections. Scroll drives GSAP timeline.

## Chapters (scroll progress)

| Range | Chapter | UI label |
|-------|---------|----------|
| 0 – 0.32 | Portraits | `01 · Portraits` |
| 0.32 – 0.52 | Dissolve | `02 · Dissolve` |
| 0.52 – 1.0 | Tulip | `03 · Reverie` |

## Reverie-specific tokens (override Master CTA)

| Role | Hex | Notes |
|------|-----|-------|
| Accent | `#C97878` | Tulip coral — not SaaS blue |
| Mist | `#F5E6EA` | Floral atmosphere |
| Rim | `#7B8CDE` | Portrait rim light echo |

## Motion

- Scroll-only. No autoplay ambient motion at rest.
- `prefers-reduced-motion`: disable Lenis, keep scrub mapping.
- Transitions: 200–400ms for UI opacity only.

## UI Components

- Top: hairline scroll progress (1px)
- Left rail: chapter index (desktop only)
- Header: wordmark `Reverie` — Playfair Display
- Footer: scroll cue — fades after first scroll

## Avoid on this page

- Blue CTA buttons (no CTAs in sequence)
- Heavy glassmorphism panels
- Bounce / spin animations
