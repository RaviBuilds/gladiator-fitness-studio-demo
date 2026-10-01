/**
 * Accessible star rating display. Fixed component; rating value always
 * comes from lib/reviews.ts, never invented in the component.
 *
 * `variant="google"` renders the fixed Google-yellow star treatment used
 * inside Google-native review cards (see components/motion/ReviewSignal.tsx)
 * — this is a source-identity color, not the gym's `--accent` token, so it
 * is a literal hex value that never recolors with a clone's accent. The
 * default variant (used everywhere else on the site, e.g. the rating dial
 * and Trust rail) is unchanged.
 */
export function RatingStars({
  rating,
  max = 5,
  variant = "default",
}: {
  rating: number;
  max?: number;
  variant?: "default" | "google";
}) {
  const stars = Array.from({ length: max }, (_, i) => {
    const filled = Math.min(1, Math.max(0, rating - i));
    return filled;
  });

  const trackClass = variant === "google" ? "text-[#DADCE0]" : "text-(--border)";
  const fillClass = variant === "google" ? "text-[#FBBC04]" : "text-(--accent)";

  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`Rated ${rating} out of ${max} stars`}
    >
      {stars.map((fill, i) => (
        <span key={i} className="relative inline-block h-4 w-4" aria-hidden="true">
          <svg viewBox="0 0 20 20" className={`absolute inset-0 h-4 w-4 ${trackClass}`} fill="currentColor">
            <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z" />
          </svg>
          <span
            className={`absolute inset-0 overflow-hidden ${fillClass}`}
            style={{ width: `${fill * 100}%` }}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z" />
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
}
