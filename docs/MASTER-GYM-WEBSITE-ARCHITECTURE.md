# Master Gym Website Architecture

Canonical foundation for the Blogspage AI Gym Website Factory.
Source of truth: `docs/BLOGSPAGE-AI-WEBSITE-FACTORY-SPECIFICATION.docx`.

## The Model

```
MASTER DESIGN SYSTEM (fixed)
        +
MASTER COMPONENT SYSTEM (fixed)
        +
MASTER MOTION SYSTEM (fixed)
        +
MASTER SEO SYSTEM (fixed)
        +
BUSINESS DATA (lib/*.ts, per gym)
        +
BUSINESS ASSETS (public/assets/*, per gym)
        =
INDIVIDUAL GYM WEBSITE
```

This is a controlled premium website system, not a website builder. A normal
gym clone edits data and replaces assets. It does not touch component
internals.

## Rendering Philosophy

- Next.js App Router, TypeScript, Tailwind CSS.
- Server Components by default. Static rendering wherever possible.
- Client Components only where genuine interaction requires them (motion,
  sliders, dialogs, forms).
- Metadata is centralized through the Next.js Metadata API in `app/layout.tsx`,
  sourced from `lib/seo.ts`. No metadata scattered through page components.
- No CMS, no database, no admin dashboard, no multi-tenant backend. The data
  layer is TypeScript modules under `lib/`.

## Fixed vs Customizable

**Fixed (master system, never changes per gym):**
typography family/scale, spacing system, grid/layout system, responsive
breakpoints, component structure, button/card language, motion language,
interaction behavior, accessibility implementation, SEO implementation code,
structured-data builder, image handling, form component, WhatsApp component,
Google Reviews component, gallery component, navigation, footer architecture,
master page section order.

**Customizable (per gym, lives in `lib/` and `public/assets/`):**
business name, logo, favicon, accent color, hero imagery, section imagery,
gallery, business description, services, programs, reviews, rating, review
count, review tagline, membership, location, address, phone, WhatsApp, email,
hours, Instagram, social links, contact destination, metadata, canonical URL,
OG image, optional section flags.

Core rule: **change the data and assets, do not redesign the component.**

## Component / Data Boundary

Every section component reads from a typed export in `lib/`. Components never
hardcode business content. If a component needs a new field, the field is
added to the relevant type in `lib/types.ts` and the corresponding data file,
not hardcoded inline.

## Optional Section Strategy

`lib/sections.ts` exports a single `sections: SectionConfiguration` flag
object. A section renders only when its flag is `true` AND its underlying
data is present/verified. Missing data for an optional section must not
produce empty states ("TBD", blank cards, broken widgets) — the section
disappears entirely and the master page hierarchy otherwise stays intact.

Mandatory sections (always present): Header, Hero, Programs, Why Choose Us,
Google Reviews, Contact, Location, Final CTA, Footer.

Why Choose Us content is sourced from `whyChooseUs: WhyChooseUsItem[]` in
`lib/why-choose-us.ts` (type defined in `lib/types.ts`). This data file was
added to the canonical foundation to formalize this mandatory section within
the Master Gym Data Contract — see
`docs/MASTER-GYM-DATA-CONTRACT.md#why-choose-us--libwhy-choose-usts` for the
type definition. It follows the same "one typed constant per file" rule as
every other `lib/*.ts` module, so it does not introduce any new pattern to
the Component/Data Boundary described above.

Recommended sections: Trust, About, FAQ, Gallery, Membership, Instagram.

Conditional sections: Transformations, Founder/Trainer, Instagram live
integration, Membership pricing.

## Dependency Philosophy

Zero new dependencies for Factory v1. The stack (Next.js, React, TypeScript,
Tailwind, native CSS, native browser APIs) is sufficient for data-driven
static/server-rendered pages. Animation, carousel, form, and UI-component
libraries are explicitly out of scope unless an unavoidable requirement is
discovered and documented as a deliberate, explicit exception.

## Clone Philosophy

1. Duplicate the master repository. No redesign.
2. Replace assets under `public/assets/*`.
3. Edit the typed data files under `lib/*`.
4. Set environment variables (secrets only, never public).
5. Set the accent color in `lib/business.ts`.
6. `npm run lint && npm run build`.
7. Browser QA across desktop/tablet/mobile.
8. Deploy.

See `MASTER-GYM-CUSTOMIZATION-SOP.md` for the detailed checklist.

## Naming Deviation From the Source Specification

The source specification (docx, §32) refers to the data folder as `data/`.
This canonical foundation uses `lib/` instead, per explicit direction for this
phase. The contents and responsibilities of each file are otherwise identical
to what the specification describes. Any future agent reading the original
docx should mentally substitute `lib/` for `data/`.

## Why This Architecture

- **Data is separated from components** so a gym clone never requires editing
  JSX. This keeps the Factory's per-project cost close to data entry and asset
  replacement, which is the entire economic point of a factory model.
- **The page is static-first** because gym websites are marketing/lead-gen
  pages, not applications. Static/server rendering gives the best performance
  (LCP, CLS, INP) for the least engineering effort.
- **Dependencies are minimized** because every dependency is a long-term
  maintenance and upgrade cost multiplied across every gym clone. Native
  Next.js/React/CSS capabilities cover the v1 feature set.
- **Sections are feature-gated** because different gyms have different asset
  and content availability. A flag-driven section list means one master page
  can honestly represent very different businesses without conditional JSX
  scattered through components.
- **Typography is fixed** because it is one of the three Factory signatures
  (editorial athletic design). Per-gym font switching would erode the
  recognizable design language that makes the Factory a product rather than a
  one-off build each time.
- **Accent color is configurable** because it is the cheapest, safest lever
  for per-gym visual identity — it does not touch typography, spacing, layout,
  or component shape, so it cannot break the design system.
- **Social/reviews are data-driven and manually curated** because live
  scraping/API integration is a runtime dependency, a cost, and a failure
  surface. Manually curated data is predictable, fast, and controllable.
- **This is suitable for rapid gym cloning** because the entire customization
  surface is: typed data files, an assets folder, one accent token, and
  environment variables. Nothing else needs to be touched for a standard
  clone.
