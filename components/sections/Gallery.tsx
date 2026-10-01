import { galleryItems } from "@/lib/gallery";
import { Container } from "@/components/ui/Container";
import { GalleryRail } from "@/components/motion/GalleryRail";

/**
 * Gallery — continuous horizontal image rail. Server Component: the section
 * shell, header markup, technical background graphic and data are
 * server-rendered; only the moving strip, its arrow controls and lightbox
 * (components/motion/GalleryRail.tsx) are a client island.
 *
 * The eyebrow/title live here (server-rendered) but the arrow buttons are
 * rendered by GalleryRail and slotted into this same header row via a named
 * flex slot (`data-gallery-controls`), because the arrows drive GalleryRail's
 * own rAF offset state and must stay inside that client island. Keeping the
 * heading itself server-rendered avoids turning the whole section client.
 *
 * Deliberately compact — this is a single-row editorial film strip, not the
 * previous multi-row masonry grid, so the section keeps a low vertical
 * footprint regardless of how many images lib/gallery.ts supplies.
 */
export function Gallery() {
  if (galleryItems.length === 0) return null;

  return (
    <section id="gallery" className="factory-gallery-section">
      <span className="factory-gallery-bg" aria-hidden="true">
        <svg viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" focusable="false">
          {/* Oversized weight-plate ring, cropped by the section edge. */}
          <circle cx="1120" cy="60" r="260" className="factory-gallery-bg-ring-major" />
          <circle cx="1120" cy="60" r="200" className="factory-gallery-bg-ring-minor" />
          {/* Calibration ticks around the plate ring. */}
          <g className="factory-gallery-bg-ticks">
            {Array.from({ length: 24 }, (_, i) => {
              const angle = (i * 360) / 24;
              const rad = (angle * Math.PI) / 180;
              const cx = 1120 + Math.cos(rad) * 260;
              const cy = 60 + Math.sin(rad) * 260;
              const cx2 = 1120 + Math.cos(rad) * 278;
              const cy2 = 60 + Math.sin(rad) * 278;
              return <line key={angle} x1={cx} y1={cy} x2={cx2} y2={cy2} />;
            })}
          </g>
          {/* Simplified barbell line entering from the left edge. */}
          <g className="factory-gallery-bg-barbell">
            <line x1="-40" y1="430" x2="520" y2="430" />
            <rect x="-20" y="405" width="26" height="50" />
            <rect x="30" y="415" width="16" height="30" />
            <rect x="480" y="415" width="16" height="30" />
          </g>
          {/* Registration crosses + a small technical label. */}
          <g className="factory-gallery-bg-marks">
            <g transform="translate(90,90)">
              <line x1="-9" y1="0" x2="9" y2="0" />
              <line x1="0" y1="-9" x2="0" y2="9" />
            </g>
            <g transform="translate(640,150)">
              <line x1="-9" y1="0" x2="9" y2="0" />
              <line x1="0" y1="-9" x2="0" y2="9" />
            </g>
          </g>
          <text x="640" y="185" className="factory-gallery-bg-label">
            VISUAL REGISTER / GYM LIFE
          </text>
        </svg>
      </span>

      <Container>
        <div className="factory-gallery-header">
          <div>
            <div className="flex items-center gap-3">
              <span className="factory-eyebrow" aria-hidden="true">
                07
              </span>
              <span className="factory-eyebrow">Gallery</span>
            </div>
            <h2 className="mt-3 text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-(--text-primary)">
              Inside the gym.
            </h2>
          </div>
          <div className="factory-gallery-header-controls" data-gallery-controls />
        </div>
      </Container>

      <GalleryRail items={galleryItems} />
    </section>
  );
}
