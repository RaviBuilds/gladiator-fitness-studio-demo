/**
 * /journey — Fitness Journey page media.
 *
 * Page-specific and deliberately tiny: the one campaign image the Fitness
 * Journey opening state is composed around. A clone replaces `src`, `alt`
 * and the crop positions here (and the asset in public/assets/), never the
 * component.
 *
 * Source-First: this is a page campaign image, NOT a photograph of this
 * gym's own floor. `alt` therefore describes only what is in the frame and
 * makes no claim about the facility. If a clone supplies a real photograph
 * of its own gym, the alt may say so.
 *
 * Current asset: /assets/journey-home.webp — 1672 × 941 (≈16:9 landscape),
 * subject on the right third of the frame.
 */
export interface JourneyImage {
  src: string;
  alt: string;
  /** CSS object-position for the cover crop (desktop split column, ≥1024px). */
  objectPosition?: string;
  /** Optional CSS object-position for the narrow mobile/tablet band (<1024px). */
  objectPositionMobile?: string;
}

export interface JourneyConfiguration {
  image: JourneyImage;
}

export const journeyConfiguration: JourneyConfiguration = {
  image: {
    src: "/assets/journey-home.webp",
    alt: "Athletic man seated on a weight bench performing a single-arm dumbbell curl in a modern gym, with dumbbell racks and weight plates in the background",
    objectPosition: "82% 40%",
    objectPositionMobile: "78% 30%",
  },
};
