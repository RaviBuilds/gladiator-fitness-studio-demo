<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Blogspage AI Gym Website Factory — Project Rules

This repository is the master template for the Blogspage AI Gym Website
Factory. Read `docs/MASTER-GYM-WEBSITE-ARCHITECTURE.md` first. Source spec:
`docs/BLOGSPAGE-AI-WEBSITE-FACTORY-SPECIFICATION.docx`.

**The one rule that matters most:** Do not customize component design for an
individual gym unless the requested change exposes a reusable deficiency in
the Master Gym Website System. Individual gym projects are data-and-asset
customization projects, not redesign projects.

## Source-First Content
- Every business fact (name, address, phone, hours, services, reviews,
  pricing) must come from real, supplied information. Never invent business
  claims, statistics, superlatives ("best gym in [city]"), or review
  content.
- Unverified fields do not render. A `Service` with `verified: false`, a
  `TransformationItem` with `consentVerified: false`, or a disabled
  `MembershipConfiguration` must not appear on the live site.

## Fixed vs Customizable
- Fixed: typography, spacing, grid, motion language, component structure,
  accessibility implementation, SEO implementation code, schema builder,
  image handling, WhatsApp/Reviews/Gallery components, navigation, footer.
- Customizable: everything under `lib/*.ts` and `public/assets/*`, plus the
  single `accentColor` token.
- Full matrix: `docs/MASTER-GYM-WEBSITE-ARCHITECTURE.md`.

## Dependency Discipline
- Zero new dependencies is the default expectation. Do not add animation,
  carousel, form, or UI-component libraries without an explicit, documented,
  unavoidable requirement.

## Asset-First Implementation
- Follow `docs/MASTER-GYM-ASSET-CONTRACT.md` for folder structure and
  naming. Every image requires real, descriptive alt text.

## SEO Rules
- Metadata lives only in `lib/seo.ts`, rendered centrally via the Next.js
  Metadata API in `app/layout.tsx`. See `docs/MASTER-GYM-SEO-CONTRACT.md`.
- Visible reviews (`displayReviews`) and review structured-data eligibility
  are separate concepts — never conflate them.

## Accessibility Rules
- Semantic HTML, one `<h1>`, logical heading hierarchy, keyboard navigation,
  visible focus, accessible forms/dialogs/carousels, `prefers-reduced-motion`
  support. Not customizable away per client.

## Performance Rules
- Server Components by default. Client Components only where interaction
  genuinely requires them. Hero images load with priority; everything else
  lazy/deferred.

## Validation Rules
- Run `npm run lint` and `npm run build` after any change before considering
  it complete.
- Before deploying any gym site, complete the checklist in
  `docs/MASTER-GYM-CUSTOMIZATION-SOP.md`.
