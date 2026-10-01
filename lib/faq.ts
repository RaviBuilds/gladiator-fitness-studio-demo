import type { FaqItem } from "./types";

/**
 * Master FAQ data. Generated only from real, known business information.
 * If the answer to a potential question isn't actually known, don't create
 * that FAQ entry.
 *
 * GLADIATOR FITNESS STUDIO — from docs/gladiator-gym-research.md (FAQ.*).
 * All six items are VERIFIED_OFFICIAL or PUBLICLY_REPORTED facts; owner
 * verification is recommended before final-client production. No
 * cancellation/freeze/trial/joining-fee/class-schedule/guest-policy FAQ is
 * added because the research package does not support those answers.
 */
export const faq: FaqItem[] = [
  {
    id: "01",
    question: "Where is Gladiator Fitness Studio located?",
    answer:
      "Prince Complex on Hitech City Main Road, opposite Leaf Hospital, Sri Vivekananda Nagar, Madhapur, Hyderabad.",
  },
  {
    id: "02",
    question: "What are the opening hours?",
    answer:
      "Monday to Saturday: 5:30 AM–10:00 PM. Sunday: 6:00 AM–10:00 PM, based on the sources documented in the research.",
  },
  {
    id: "03",
    question: "What programs are offered?",
    answer:
      "Publicly documented programs include weight training, cardio fitness, personal training, functional training, bodybuilding and structured weight-loss programs.",
  },
  {
    id: "04",
    question: "How many Gladiator Fitness Studio branches are there?",
    answer:
      "Four branches were identified in Hyderabad: Madhapur, Falaknuma, Kattedan and Rakshapuram.",
  },
  {
    id: "05",
    question: "Is the Madhapur branch wheelchair accessible?",
    answer:
      "Yes. A wheelchair-accessible entrance and car parking are publicly reported for the Madhapur branch.",
  },
  {
    id: "06",
    question: "Is membership pricing available online?",
    answer: "Current direct membership pricing was not verified in the research.",
  },
];
