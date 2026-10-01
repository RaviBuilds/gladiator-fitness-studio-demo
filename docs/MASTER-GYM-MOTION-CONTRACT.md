# Master Gym Motion Contract

## Motion Philosophy

Motion language: **controlled kinetic editorial**. Motion exists to improve
hierarchy, continuity, and feedback — never as decoration for its own sake.

**Allowed:** clip reveal, transform, opacity, mask reveal, subtle image
movement, section reveal, sticky storytelling, hover interactions, hero
transitions, progress indicators.

**Avoid:** scroll-jacking, continuous parallax, excessive counters, random
floating objects, bounce animations, unnecessary 3D, large animation
packages.

## Reveal Strategy

Section content reveals on scroll using CSS transitions/`IntersectionObserver`
(native browser API), not a library. A `Reveal` client component (built in
the homepage implementation phase) wraps section content and toggles a
visible state class when it enters the viewport.

## Hero Motion

- Directional mask / clip reveal, controlled translation, typography
  movement, image scale, layered transition between slides.
- Avoid simple fade, generic horizontal carousel, bounce, random animation.
- Default timing: ~5-7 seconds per slide, 700-1000ms transition. These are
  centrally configured constants, not per-client values.

## Sticky Sections

Sticky storytelling (e.g. a pinned image with scrolling text) is allowed
where it clarifies a narrative (such as Transformations). Implemented with
CSS `position: sticky` plus scroll-based reveal, not a scroll-jacking
library.

## Reduced Motion

Every animated component must respect `prefers-reduced-motion`. When
reduced motion is requested, transitions collapse to instant or minimal
opacity changes. This is not customizable away per client.

## Performance Rules

- Motion must not block first paint or increase JS bundle size
  significantly.
- No animation library dependency for Factory v1 — native CSS
  transitions/animations and `IntersectionObserver` are sufficient for the
  allowed motion vocabulary.
- Motion-heavy components (hero slider, reveal wrapper, sticky story) are
  isolated as small client components; the rest of the page stays server
  rendered.

## Client-Component Boundaries

Potential reusable motion components (to be built in the homepage
implementation phase, not this canonical phase):

```
motion/
├── Reveal.tsx
├── HeroSlider.tsx
├── ScrollProgress.tsx
├── ImageReveal.tsx
└── StickyStory.tsx
```

Only these motion-dependent leaf components use `"use client"`. The page
itself, and all data-only sections, remain Server Components.
