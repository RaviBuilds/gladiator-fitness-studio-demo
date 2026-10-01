import type { Service } from "./types";

/**
 * Master services data. Only services with verified:true render on the live
 * site. A service can exist here and remain disabled — this is the direct
 * mechanism that prevents an unverified/discontinued program from silently
 * appearing on a gym website.
 *
 * GLADIATOR FITNESS STUDIO — all 6 programs from docs/gladiator-gym-research.md
 * (PROGRAMS.*). Every entry is VERIFIED_OFFICIAL or PUBLICLY_REPORTED (Google
 * Business Profile / public directory listings); owner verification is
 * recommended before final-client production. The research explicitly lists
 * CrossFit-style training, yoga, martial arts, boxing, online coaching and
 * distinct women's/men's programs as `NOT_VERIFIED` modalities — none of
 * those are implemented here.
 *
 * STABLE IDs: `strength-training`, `conditioning` and `personal-training`
 * are cross-referenced by id from the frozen educational module
 * lib/training-intelligence.ts (`programId`, see
 * components/sections/trainingLoadout.ts). These three ids must not be
 * renamed even though the gym-facing program name differs (e.g. "Weight
 * Training" here renders under the stable id `strength-training`).
 */
export const services: Service[] = [
  {
    id: "strength-training",
    name: "Weight Training",
    description: "Weight training with dedicated heavy-lifting areas.",
    icon: "strength",
    image: "/assets/programs/gladiator-fitness-studio-madhapur-program-weight-training.jpg",
    verified: true,
    ctaLabel: "Ask about weight training",
    ctaHref: undefined,
  },
  {
    id: "conditioning",
    name: "Cardio Fitness",
    description:
      "Cardiovascular conditioning using the documented cardio areas and machines.",
    icon: "cardio",
    image: "/assets/programs/gladiator-fitness-studio-madhapur-program-cardio-fitness.jpg",
    verified: true,
    ctaLabel: "Ask about cardio fitness",
    ctaHref: undefined,
  },
  {
    id: "personal-training",
    name: "Personal Training",
    description: "One-on-one personal training with certified coaching support.",
    icon: "coaching",
    image: "/assets/programs/gladiator-fitness-studio-madhapur-program-personal-training.jpg",
    verified: true,
    ctaLabel: "Ask about personal training",
    ctaHref: undefined,
  },
  {
    id: "functional-training",
    name: "Functional Training",
    description: "Functional fitness training with dedicated space and equipment.",
    icon: "equipment",
    image: "/assets/programs/gladiator-fitness-studio-madhapur-program-functional-training.jpg",
    verified: true,
    ctaLabel: "Ask about functional training",
    ctaHref: undefined,
  },
  {
    id: "bodybuilding",
    name: "Bodybuilding",
    description: "Bodybuilding programs on the main training floor.",
    icon: "strength",
    image: "/assets/programs/gladiator-fitness-studio-madhapur-program-bodybuilding.jpg",
    verified: true,
    ctaLabel: "Ask about bodybuilding",
    ctaHref: undefined,
  },
  {
    id: "weight-loss",
    name: "Weight Loss Programs",
    description: "Structured weight-loss programs are publicly reported.",
    icon: "equipment",
    image: "/assets/programs/gladiator-fitness-studio-madhapur-program-weight-loss.jpg",
    verified: true,
    ctaLabel: "Ask about weight-loss programs",
    ctaHref: undefined,
  },
];
