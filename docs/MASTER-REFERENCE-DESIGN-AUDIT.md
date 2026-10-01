# Master Reference Design Audit

Twelve gym/fitness landing page references were reviewed
(`docs/references/gym-reference-01.webp` through `gym-reference-12.webp`,
sourced from Dribbble-style gym templates and case studies). This document
records what was observed in each, separates reusable *patterns* from
surface-level *styling* that must not be cloned, and states the design
language derived for the Master Gym Website System.

**Rule applied throughout:** we borrow structural/interaction ideas, never
literal color palettes, literal type choices, or literal layouts. Nothing
here is copied pixel-for-pixel.

## Per-reference notes

1. **Pulse** — Light background, oversized condensed display headline
   ("FITNESS REDEFINED") with a rotated photo collage behind a centered
   hero athlete cutout. Circular badge overlapping the image. Diagonal-cut
   program cards ("Signature Experiences") with a numbered/labelled
   service tag and a diagonal image mask. Quote-style testimonial block
   with oversized quotation marks. Rounded circular CTA button.
   *Reusable idea:* diagonal image-mask card treatment for
   programs/services; oversized editorial headline scale.
   *Reject:* light color scheme (spec calls for dark editorial), photo
   collage overload, circular "GET IN TOUCH" gimmick button.

2. **USA Gym redesign** — Case-study mockup, dark background, neon
   lime-on-black accent, glow/smoke effects behind hero athlete, embedded
   BMI calculator widget, device-frame presentation.
   *Reusable idea:* none structurally new beyond dark canvas + single
   accent color, which the Factory already mandates via `accentColor`.
   *Reject:* neon glow/smoke gradients, gimmicky embedded calculator,
   device-frame mockup chrome — explicitly the "neon gradient" cliché the
   spec warns against.

3. **PowerFit** — Full-bleed dark hero photo with bold condensed white
   headline overlay, marquee-style stat ticker strip beneath hero,
   asymmetric photo collage, numbered trainer list, red pill CTAs,
   giant reversed-out footer wordmark.
   *Reusable idea:* marquee/ticker strip for trust stats; numbered plain-
   text trainer list (no card chrome); oversized footer wordmark as a
   graphic device.
   *Reject:* red/black color pairing is the literal cliché named in the
   spec — do not reuse red as accent or backdrop.

4. **PowerBlast** — Dark background, yellow accent, oversized faded
   wordmark behind hero as a background typographic layer, asymmetric
   photo stack in "about," plain three-photo services row with captions
   below, single large membership feature block with photo + bullet list
   + price.
   *Reusable idea:* faded oversized wordmark as a background layer behind
   a section (subtle, low-opacity, decorative typographic texture); single
   membership highlight block combining photo + bullets + price without a
   repetitive pricing-card grid.
   *Reject:* yellow-on-black high-saturation accent, generic headshot grid
   for trainers.

5. **Recess Fitness Club** — Dark hero, lime accent, floating stat chips
   with glassmorphic panels pinned over the hero photo, vertical rotated
   badge text ("BEST GYM IN DALLAS"), stat strip below hero.
   *Reject:* glassmorphism is explicitly banned by the spec. Floating chip
   overload is decorative, not structural — avoid literal reuse, though
   the concept of one or two restrained caption labels near a hero image
   is acceptable if flattened (no blur/translucency).

6. **Flexova** — Dark red/black palette (cliché, rejected as a palette),
   but structurally interesting: numbered service slides ("01 Personal
   Training") shown as a horizontal split-color card, a single trainer
   spotlight card with rotated side-label text, a numbered vertical
   "how it works" flow connected by a line, and a testimonial carousel
   with source-cited quotes.
   *Reusable idea:* numbered vertical process flow with a connecting line;
   single trainer/coach spotlight with rotated vertical label as a
   typographic accent (not decorative gradient).
   *Reject:* red/black palette, glow effects on photos.

7. **FitLogic** — Blue gradient hero, oversized bold condensed headline
   split into three lines, floating stat/community card bottom-right,
   pill-shaped filter tags under headline.
   *Reject:* gradient hero background is against the "no gradients"
   spirit of the spec; floating card treatment.
   *Reusable idea:* pill tag row for listing programs/categories inline
   with hero copy (useful for a trust strip), but must be flattened,
   bordered, no gradient.

8. **FitnessCh** — Light/green wellness palette, before/after
   transformation carousel presented as a stacked card with a centered
   focus card and dimmed side cards peeking in from left/right, quote
   testimonial with oversized quotation glyph, personal "meet the coach"
   split section.
   *Reusable idea:* peeking carousel pattern (centered focus item, adjacent
   items partially visible) is a strong, accessible pattern for
   Transformations/Reviews — keep for our carousel/track sections, without
   the peppy green wellness palette.
   *Reject:* light green wellness palette, rounded soft cards.

9. **RedDevs** — Dark red/purple gradient palette, generic icon-card grid
   for services, video-play thumbnail with dotted decorative pattern,
   repetitive three-tier pricing cards, generic circular avatar
   testimonials.
   *Reject entirely as a styling reference* — this is the "repetitive
   card grid" and "purple gradient" pattern the spec explicitly tells us
   to avoid. No pattern here is worth reusing structurally beyond what
   the Factory already does better (editorial index over icon-card grid).

10. **GymX** — Dark orange/black fire-themed hero, marquee tag strip,
    numbered stat cards, plain three-photo service grid, membership tier
    cards, closing CTA with dramatic smoke photo.
    *Reject:* orange fire theme and stock "intensity" smoke photography
    cliché; generic icon-less stat cards.

11. **PulseFit** — Dark hero with pill-shaped floating nav, oversized
    two-tone headline typography with a photo bleeding through the letters
    (word "Train...best." with the athlete photo overlapping the text
    baseline), thin decorative line motif crossing the photo.
    *Reusable idea:* headline-and-photo interplay where a large photo
    slightly overlaps/bleeds past the typographic block (asymmetric hero
    composition, photo breaking the grid) is a strong premium-editorial
    device.
    *Reject:* pill floating nav pod, two-tone lime/white gradient text.

12. **FFL** — Dark orange hero, running athlete cutout, stat row, pill
    tag row, horizontal scrollable services strip with arrow controls,
    "why choose us" as a stacked accordion-style list with expand
    chevrons, world map with location dots for multi-location presence.
    *Reusable idea:* horizontal scroll strip with prev/next arrow controls
    for programs/services on constrained viewports; expandable list rows
    for a "why choose us" section as an alternative to card grids.
    *Reject:* orange fire palette, world map decoration (not applicable,
    single-location gyms).

## Cross-reference patterns worth adopting (structure, not skin)

- **Asymmetric hero composition**: large photo breaking out of a
  containing box or bleeding past a typographic block, rather than a
  centered stock hero banner. (refs 1, 3, 11)
- **Editorial numbered index** for programs/services instead of icon-card
  grids: numbered labels (01, 02...), diagonal or split image treatment,
  caption + short copy, no repeated identical card chrome. (refs 1, 6, 12)
- **Marquee/ticker trust strip**: a thin horizontal strip of stats or
  credentials directly under the hero, plain text, no icons required.
  (refs 3, 5, 11)
- **Numbered vertical process flow** with a connecting line for
  step-based content (how-it-works, program structure). (ref 6)
- **Peeking carousel**: centered focus card with adjacent items partially
  visible at reduced opacity/scale, for transformations and reviews.
  (ref 8)
- **Single spotlight block** (photo + copy + bullets, no repeated grid)
  for a trainer/coach or membership highlight, avoiding generic card
  grids entirely for content that has only one true "hero" item.
  (refs 4, 6)
- **Oversized faded background wordmark** as a subtle full-bleed
  typographic texture layer behind a section — used sparingly, low
  opacity, never obstructing content or contrast. (refs 3, 4)
- **Rotated vertical micro-labels** as a typographic accent next to a
  photo (e.g. a badge or credential running vertically along an edge),
  used as a flat text element, never a glassmorphic chip. (refs 5, 6)

## What must NOT be reused (explicitly rejected clichés)

- Red/black gym color pairing (refs 3, 6, 9) — banned by spec as the
  generic gym cliché.
- Neon/lime or purple glow gradients and smoke/light-leak photo effects
  (refs 2, 5, 6, 9, 10) — banned by spec.
- Glassmorphic floating stat chips/panels over hero photos (refs 5, 7) —
  banned by spec.
- Repetitive icon-in-a-box card grids for services/trainers with
  identical chrome (refs 9, 10, 11) — banned by spec as "repetitive card
  grids."
- Device-frame mockups, embedded gimmick widgets (BMI calculator),
  decorative dotted patterns with no informational value (refs 2, 9).
- Any literal color palette from a single reference — none of them match
  the Factory's dark-editorial-with-single-accent requirement as-is.

## Derived master design language

Building on the architecture/motion contracts already in place, the
visual system for this rebuild is:

- **Palette**: near-black canvas (not pure #000), one warm off-white for
  primary text, a single desaturated-but-legible `accentColor` used
  sparingly (underlines, numerals, active states, CTA) — never as a
  background gradient or glow.
- **Typography**: oversized condensed/tight-tracking display headlines
  for section titles and hero (editorial newspaper-poster energy per
  refs 1/3/11), restrained body copy at a calm reading size. One `<h1>`
  per page per existing accessibility rule.
- **Imagery**: full-bleed or grid-breaking photography (asymmetric crops,
  photo bleeding past its container edge) instead of centered stock
  banners or rounded soft cards.
- **Programs/Services**: editorial numbered index list (already planned
  per architecture doc) — no icon-card grid.
- **Why Choose Us**: split-selectable-panel interaction (already planned)
  — informed by the "expandable list row" and "spotlight block" patterns
  above, flattened, no glassmorphism.
- **Trust/stat strip**: plain marquee-style horizontal strip, text-only or
  thin rule dividers, directly under hero.
- **Transformations/Reviews carousels**: peeking-carousel structure
  (centered focus + dimmed adjacent items) built with CSS scroll-snap and
  IntersectionObserver per the motion contract — no JS carousel library.
- **Section texture**: optional oversized low-opacity background wordmark
  behind select sections as a decorative typographic layer, CSS-only,
  respecting `prefers-reduced-motion` and never reducing text contrast.
- **Motion**: reveal-on-scroll and hover/focus micro-interactions only,
  per the existing motion contract — no parallax glow, no smoke/light
  leak effects, no carousel auto-scroll libraries.

This language is deliberately distinct from every individual reference
image while reusing the structural ideas that recur across premium gym
marketing sites in 2024-2025.
