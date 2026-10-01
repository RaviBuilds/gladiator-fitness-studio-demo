import type { ReactNode } from "react";

/**
 * Fixed editorial heading primitive: eyebrow + H2 + optional supporting
 * copy. Used across sections instead of a repeated icon/title/card pattern.
 */
export function SectionHeading({
  eyebrow,
  index,
  title,
  supporting,
  align = "left",
}: {
  eyebrow: string;
  index?: string;
  title: ReactNode;
  supporting?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <div
        className={`flex items-center gap-3 ${
          align === "center" ? "justify-center" : "justify-start"
        }`}
      >
        {index && (
          <span className="factory-eyebrow" aria-hidden="true">
            {index}
          </span>
        )}
        <span className="factory-eyebrow">{eyebrow}</span>
      </div>
      <h2 className="mt-3 text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-(--text-primary)">
        {title}
      </h2>
      {supporting && (
        <p
          className={`mt-4 max-w-2xl text-base leading-7 text-(--text-secondary) ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {supporting}
        </p>
      )}
    </div>
  );
}
