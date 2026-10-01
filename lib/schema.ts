import type { Business } from "./types";

/**
 * Master Gym SEO Contract — structured-data builder. Consumes verified
 * fields only. Support exactly this field set; do not grow it into a
 * generic schema engine. See docs/MASTER-GYM-SEO-CONTRACT.md.
 */
export interface LocalBusinessSchemaInput {
  schemaType: string;
  name: string;
  address: Business["address"];
  telephone: string;
  url: string;
  image: string;
  openingHours: Business["hours"];
  sameAs?: string[];
  geo?: { latitude: number; longitude: number };
  priceRange?: string;
}

const dayAbbreviation: Record<string, string> = {
  Monday: "Mo",
  Tuesday: "Tu",
  Wednesday: "We",
  Thursday: "Th",
  Friday: "Fr",
  Saturday: "Sa",
  Sunday: "Su",
};

/**
 * Builds a schema.org LocalBusiness JSON-LD object from verified fields
 * only. Never invents geo coordinates, price range, or social links that
 * were not explicitly supplied.
 */
export function buildLocalBusinessSchema(input: LocalBusinessSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": input.schemaType,
    name: input.name,
    telephone: input.telephone,
    url: input.url,
    image: input.image,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.address.addressLine,
      addressLocality: input.address.locality,
      addressRegion: input.address.state,
      postalCode: input.address.postalCode,
      addressCountry: undefined,
    },
    openingHoursSpecification: input.openingHours.map((hours) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayAbbreviation[hours.day] ?? hours.day,
      opens: hours.open,
      closes: hours.close,
    })),
    ...(input.sameAs && input.sameAs.length > 0 ? { sameAs: input.sameAs } : {}),
    ...(input.geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: input.geo.latitude,
            longitude: input.geo.longitude,
          },
        }
      : {}),
    ...(input.priceRange ? { priceRange: input.priceRange } : {}),
  };
}
