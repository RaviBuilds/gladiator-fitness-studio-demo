import { business } from "@/lib/business";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Section 11 — Location & Hours.
 *
 * Editorial "facility access" composition on the site grid: a location
 * identity register on the left against an hours register on the right, over
 * the factory's technical line-art background language (oversized pin outline,
 * crosshair, coordinate ticks, calibration strip, vertical edge label). No
 * third-party map SDK and no embedded iframe — the directions CTA links out to
 * the verified map URL held in lib/business.ts.
 *
 * SOURCE-FIRST: every address part, the map URL and all hours resolve from
 * lib/business.ts. No street, locality, city, state, postcode, landmark or
 * day/time string is written into this file, so a real gym is a data edit only.
 */
export function Location() {
  const { address, hours, mapUrl } = business;

  // Compose the address from whatever parts are actually present, so a gym
  // that supplies fewer fields never renders empty lines or stray separators.
  const addressLines = [
    address.addressLine,
    [address.locality, address.city].filter((p) => p && p.trim()).join(", "),
    [address.state, address.postalCode].filter((p) => p && p.trim()).join(" "),
  ].filter((line) => line && line.trim());

  return (
    <section
      id="location"
      className="factory-location relative overflow-hidden bg-(--bg-secondary) py-20 sm:py-28 lg:py-32"
    >
      {/* Technical line-art: calibration strip, oversized pin, crosshair,
          coordinate ticks and a vertical edge label. Texture only. */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <span className="factory-location-calibration" />
        <span className="factory-location-edge">Access / Location</span>

        {/* Oversized location-pin outline, held faint behind the register. */}
        <svg
          className="factory-location-pin"
          viewBox="0 0 100 140"
          fill="none"
          strokeWidth="1.25"
        >
          <path d="M50 4C27 4 8 22 8 45c0 30 42 91 42 91s42-61 42-91C92 22 73 4 50 4Z" />
          <circle cx="50" cy="45" r="16" />
        </svg>

        {/* Coordinate crosshair, parked in the open field between the two
            registers so it never crosses the hours data. */}
        <svg
          className="absolute bottom-[14%] left-[46%] hidden h-6 w-6 stroke-current text-(--accent) opacity-40 lg:block"
          fill="none"
          strokeWidth="1"
        >
          <path d="M12,0 L12,24 M0,12 L24,12" />
        </svg>

        {/* Corner registration brackets. */}
        <svg
          className="absolute left-8 top-8 h-12 w-12 stroke-current text-(--border) opacity-40"
          fill="none"
          strokeWidth="1"
        >
          <path d="M0,12 L0,0 L12,0" />
        </svg>
        <svg
          className="absolute bottom-8 right-8 h-12 w-12 stroke-current text-(--border) opacity-40"
          fill="none"
          strokeWidth="1"
        >
          <path d="M12,0 L12,12 L0,12" />
        </svg>
      </div>

      <Container className="relative z-10">
        {/* Two-column editorial composition from tablet up; below that the
            registers stack as LOCATION -> DIRECTIONS -> HOURS. */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-12 lg:gap-x-16">
          {/* Location identity register */}
          <Reveal className="md:col-span-7">
            <div className="factory-location-heading">
              <SectionHeading eyebrow="Location & Hours" index="11" title="Find us." />
            </div>

            <p className="mt-5 max-w-md text-base leading-7 text-(--text-secondary)">
              Walk in during opening hours, or send the directions to your phone first.
            </p>

            <div className="factory-location-block">
              <p className="factory-location-block-label">Address</p>
              <address className="factory-location-address">
                {addressLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
              {address.landmark && (
                <p className="factory-location-landmark">{address.landmark}</p>
              )}
            </div>

            {mapUrl && (
              <Button
                href={mapUrl}
                variant="secondary"
                className="mt-8"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions
                <span aria-hidden="true">→</span>
              </Button>
            )}
          </Reveal>

          {/* Hours register */}
          <Reveal className="md:col-span-5" delayMs={120}>
            <div className="factory-hours">
              <p className="factory-hours-title">Hours</p>
              <dl className="factory-hours-list">
                {hours.map((h) => {
                  const closed = !h.open || !h.close;
                  return (
                    <div key={h.day} className="factory-hours-row">
                      <dt className="factory-hours-day">{h.day}</dt>
                      <dd className="factory-hours-time">
                        {closed ? (
                          <span className="factory-hours-closed">Closed</span>
                        ) : (
                          <>
                            <span>{h.open}</span>
                            <span className="factory-hours-dash" aria-hidden="true">
                              —
                            </span>
                            <span>{h.close}</span>
                          </>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
