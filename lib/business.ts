import type { Business } from "./types";

/**
 * Master business data. Public business information only — never put API
 * keys, tokens, or server credentials here.
 *
 * GLADIATOR FITNESS STUDIO — populated from docs/gladiator-gym-research.md.
 * VERIFIED_OFFICIAL fields: name, phone, address line, locality, city,
 * state, postal code (Madhapur / Hitech City branch, Google Business
 * Profile Screenshot). PUBLICLY_REPORTED (owner verification recommended
 * before final-client production): hours, description/positioning summary.
 *
 * MULTI-BRANCH NOTE: the research package documents four Hyderabad branches
 * (Madhapur, Falaknuma, Kattedan, Rakshapuram). This template's data
 * contract supports exactly one address/hours/map set per site
 * (docs/gym-customization-manifest.md §1.2), so the Madhapur branch — the
 * anchor location and the only one with a VERIFIED_OFFICIAL phone number —
 * is used here. The other three branches are not represented; this is not a
 * silent conflict resolution of a single-branch fact, it is the template's
 * existing one-location architecture.
 *
 * WHATSAPP NUMBER: docs/gladiator-gym-research.md CONTACT.whatsapp is
 * `null` / NOT_FOUND — no distinct WhatsApp number was identified. The
 * `business.whatsapp.number` field is architecturally required (every
 * WhatsApp CTA across the site reads it; there is no graceful-omission path
 * for a missing WhatsApp number). The VERIFIED_OFFICIAL Madhapur phone
 * number is reused here as the WhatsApp contact point rather than inventing
 * a different number — OWNER VERIFICATION REQUIRED to confirm this number
 * is reachable on WhatsApp before final-client production.
 *
 * mapUrl: no verified Google Maps / Place URL was found in research
 * (BRANCHES[0].map_url = NOT_FOUND). This uses a standard Google Maps
 * search-by-address URL built from the verified address text — no
 * latitude/longitude or Place ID has been invented.
 */
export const business: Business = {
  name: "Gladiator Fitness Studio",
  tagline: "Clean gym boasting spacious facilities in Madhapur, Hitech City.",
  description:
    "Gladiator Fitness Studio is a gym and fitness centre in Madhapur, Hitech City, Hyderabad, offering weight training, cardio fitness, personal training, functional training, bodybuilding and structured weight-loss programs on a spacious, clean training floor.",
  phone: "+919948313442",
  whatsapp: {
    number: "+919948313442",
    message: "Hi, I'd like to know more about membership and training at Gladiator Fitness Studio.",
  },
  email: undefined,
  address: {
    addressLine: "Prince Complex, Hitech City Main Road, opposite Leaf Hospital, Sri Vivekananda Nagar",
    locality: "Madhapur",
    city: "Hyderabad",
    state: "Telangana",
    postalCode: "500114",
    landmark: "Opposite Leaf Hospital",
  },
  hours: [
    { day: "Monday", open: "05:30 AM", close: "10:00 PM" },
    { day: "Tuesday", open: "05:30 AM", close: "10:00 PM" },
    { day: "Wednesday", open: "05:30 AM", close: "10:00 PM" },
    { day: "Thursday", open: "05:30 AM", close: "10:00 PM" },
    { day: "Friday", open: "05:30 AM", close: "10:00 PM" },
    { day: "Saturday", open: "05:30 AM", close: "10:00 PM" },
    { day: "Sunday", open: "06:00 AM", close: "10:00 PM" },
  ],
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=Gladiator+Fitness+Studio+Prince+Complex+Hitech+City+Main+Road+Madhapur+Hyderabad+500114",
  // Prompt A — Website Primary Accent (Gladiator Red). White text on this
  // accent verified at ~4.59:1 contrast; see app/globals.css for the
  // matching --accent-hover / --accent-foreground tokens.
  accentColor: "#E6001F",
};
