import { instagramConfig } from "@/lib/instagram";
import { Container } from "@/components/ui/Container";
import { InstagramEmbed } from "@/components/instagram/InstagramEmbed";

/**
 * Instagram section — official Reel embeds with editorial framing.
 *
 * Server Component shell: the header, background graphics, and layout are
 * server-rendered. Only the Instagram embed processing (InstagramEmbed) is
 * a client island.
 *
 * DISTINCTIVENESS: Gallery is a moving photographic rail with lightbox;
 * Instagram is stable social content with official embeds and profile CTA.
 *
 * ARCHITECTURE: All Instagram data (profile URL, handle, Reel URLs) lives
 * in lib/instagram.ts. Component receives zero hardcoded URLs.
 */
export function Instagram() {
  if (instagramConfig.items.length === 0) return null;

  return (
    <section className="factory-instagram-section" id="instagram">
      {/* Technical background graphics — subtle, low opacity, supporting the content */}
      <span className="factory-instagram-bg" aria-hidden="true">
        <svg viewBox="0 0 1400 600" preserveAspectRatio="xMidYMid slice" focusable="false">
          {/* Oversized camera lens outline — primary graphic motif */}
          <g className="factory-instagram-bg-lens">
            <circle cx="200" cy="140" r="160" />
            <circle cx="200" cy="140" r="120" />
            <circle cx="200" cy="140" r="80" />
            {/* Lens aperture blades - 8 triangular segments */}
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i * 360) / 8;
              const rad = (angle * Math.PI) / 180;
              const x1 = 200 + Math.cos(rad) * 50;
              const y1 = 140 + Math.sin(rad) * 50;
              const x2 = 200 + Math.cos(rad) * 80;
              const y2 = 140 + Math.sin(rad) * 80;
              return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1" />;
            })}
          </g>

          {/* Calibration registration marks */}
          <g className="factory-instagram-bg-marks">
            <g transform="translate(1120,100)">
              <line x1="-12" y1="0" x2="12" y2="0" />
              <line x1="0" y1="-12" x2="0" y2="12" />
              <circle cx="0" cy="0" r="18" fill="none" />
            </g>
            <g transform="translate(700,480)">
              <line x1="-10" y1="0" x2="10" y2="0" />
              <line x1="0" y1="-10" x2="0" y2="10" />
            </g>
            <g transform="translate(1300,420)">
              <line x1="-8" y1="0" x2="8" y2="0" />
              <line x1="0" y1="-8" x2="0" y2="8" />
            </g>
          </g>

          {/* Technical tick marks */}
          <g className="factory-instagram-bg-ticks">
            {Array.from({ length: 20 }, (_, i) => {
              const x = 900 + i * 24;
              return (
                <g key={i}>
                  <line x1={x} y1="50" x2={x} y2={i % 5 === 0 ? "66" : "58"} />
                </g>
              );
            })}
          </g>

          {/* Technical labels */}
          <text x="900" y="38" className="factory-instagram-bg-label">
            SOCIAL / VISUAL CONTENT
          </text>
          <text x="1120" y="155" className="factory-instagram-bg-label">
            08
          </text>
        </svg>
      </span>

      <Container>
        {/* Strong editorial header with prominent handle and View More CTA */}
        <div className="factory-instagram-header">
          <div className="factory-instagram-header-left">
            <div className="flex items-center gap-3">
              <span className="factory-eyebrow" aria-hidden="true">
                08
              </span>
              <span className="factory-eyebrow">Instagram</span>
            </div>
            <h2 className="mt-3 text-[clamp(1.25rem,5.4vw,2.75rem)] font-bold leading-[1.05] tracking-tight text-(--text-primary) break-words [overflow-wrap:anywhere] lg:text-[clamp(1.75rem,3.2vw,3.25rem)]">
              {instagramConfig.handle}
            </h2>
            <p className="mt-4 font-mono text-sm tracking-wide text-(--text-secondary) uppercase">
              Training. People. The gym in motion.
            </p>
          </div>

          <div className="factory-instagram-header-right">
            <a
              href={instagramConfig.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="factory-instagram-cta factory-focus group"
            >
              <span className="factory-instagram-cta-text">
                View More on Instagram
              </span>
              <svg
                className="factory-instagram-cta-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Instagram Reel embeds grid — renders all supplied items.
            The official embed carries its own creator name + "View profile"
            header and its own "View more on Instagram" footer, so no custom
            identity line or play overlay is layered on top of it: doing that
            duplicated chrome the embed already provides and forced the
            portrait Reel into a cropped frame. */}
        <div className="factory-instagram-grid">
          {instagramConfig.items.map((reel) => (
            <div key={reel.id} className="factory-instagram-grid-item">
              <InstagramEmbed reel={reel} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
