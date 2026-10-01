import type { SectionConfiguration } from "./types";

/**
 * The Factory control panel. Toggling a flag hides a section without
 * editing any component. Mandatory sections are true by default; optional
 * sections default to false until real data/assets are available.
 *
 * See docs/MASTER-GYM-WEBSITE-ARCHITECTURE.md for the master page order and
 * the mandatory/recommended/conditional section classification.
 */
export const sections: SectionConfiguration = {
  trust: true,
  about: true,
  programs: true,
  whyChooseUs: true,
  // Demo data is populated for the master template so every optional
  // section is visible for visual QA. Toggle per real gym data availability.
  transformations: true,
  // Section 05 is an EDUCATIONAL module, not a claim module: its content is
  // the global training-principles library, so unlike transformations or
  // reviews it needs no per-gym verification before it can render.
  trainingIntelligence: true,
  reviews: true,
  // Section 07 is the second EDUCATIONAL module (interval log + body map). Its
  // content is the global educational library, so like Section 05 it needs no
  // per-gym verification before it can render.
  betweenSessions: true,
  membership: true,
  gallery: true,
  instagram: true,
  faq: true,
  contact: true,
  location: true,
};
