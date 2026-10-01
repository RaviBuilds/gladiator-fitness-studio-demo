import type { WhyChooseUsConfiguration, WhyChooseUsItem } from "./types";

/**
 * Why Choose Us differentiators. Mandatory section — always present.
 *
 * GLADIATOR FITNESS STUDIO — from docs/gladiator-gym-research.md (ABOUT.*,
 * PROGRAMS.*, EQUIPMENT.*, REVIEWS.themes.positive). All entries are
 * VERIFIED_OFFICIAL or PUBLICLY_REPORTED facts; owner verification is
 * recommended before final-client production. No superlatives beyond what
 * the research package documents.
 */
export const whyChooseUs: WhyChooseUsItem[] = [
  {
    title: "Spacious, clean facilities",
    description:
      "The Madhapur branch is documented as a clean gym with spacious training facilities.",
  },
  {
    title: "Weight training and cardio fitness",
    description:
      "Dedicated weight-training and cardio-fitness areas with free weights, resistance machines and cardio equipment.",
  },
  {
    title: "Group training",
    description: "Group training sessions are offered alongside individual programming.",
  },
  {
    title: "Wheelchair accessibility",
    description: "A wheelchair-accessible entrance and car parking are reported for the Madhapur branch.",
  },
  {
    title: "Seven-day schedule",
    description:
      "Open 5:30 AM–10:00 PM Monday through Saturday, and 6:00 AM–10:00 PM on Sunday.",
  },
  {
    title: "Personal training support",
    description: "One-on-one personal training with certified coaching support is available.",
  },
];

/**
 * Section 03 composition data — the Performance Blueprint.
 *
 * The principles above are the content; this object is the sheet around them:
 * the manifesto heading, the mono deck, the group label and the single anchor
 * photograph the annotations are attached to. A clone edits this object and
 * the array, never the composition.
 *
 * `anchor.alt` describes the photograph itself (a real description of the
 * frame), not the differentiators — the principles are already readable text,
 * so restating them in alt text would be duplication, and describing the
 * photo as "illustrating" a claim would attach an unverifiable meaning to it.
 */
export const whyChooseUsConfiguration: WhyChooseUsConfiguration = {
  index: "03",
  eyebrow: "Why Choose Us",
  headlineLines: ["What actually", "makes the", "difference."],
  accentLastLine: true,
  deck: "Training principles, annotated",
  principlesLabel: "Training principles",
  anchor: {
    src: "/assets/why-choose-us/gladiator-fitness-studio-madhapur-why-choose-anchor.jpg",
    alt: "Gladiator Fitness Studio training floor in Madhapur, Hitech City, showing gym equipment and training space.",
    objectPosition: "50% 22%",
  },
};
