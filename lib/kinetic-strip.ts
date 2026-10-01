import { business } from "./business";

/**
 * Kinetic Identity Strip content. Two looping bands rendered directly under
 * the hero (see components/sections/KineticStrip.tsx). Customizable per gym,
 * but the default below is derived only from existing verified fields
 * already present in lib/business.ts — never invented superlatives — so a
 * fresh clone with zero extra configuration still stays Source-First
 * compliant. Replace with real, source-backed phrases per gym if desired.
 *
 * Content only. Direction, velocity, typography scale and density are part
 * of the fixed motion system and live in
 * components/sections/kineticBands.ts.
 */
export interface KineticStripConfiguration {
  /**
   * Declaration band (Strip 01): display scale, moves left. The first
   * phrase renders in the recessed tone, so put the brand name first and the
   * statement second.
   */
  primary: string[];
  /**
   * Technical band (Strip 02): small mono metadata, moves right. The first
   * phrase renders in the accent color, so put the most locating fact first.
   */
  secondary: string[];
}

const locality = business.address.locality || business.address.city;

export const kineticStripConfiguration: KineticStripConfiguration = {
  primary: [business.name, business.tagline],
  secondary: [locality, "Est. Training Floor", business.name].filter(
    Boolean
  ) as string[],
};
