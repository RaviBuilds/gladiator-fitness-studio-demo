import type { ReactNode } from "react";

/**
 * Fixed layout primitive. Master Component System — never customized per
 * gym. Provides the canonical max-width/padding rhythm used by every
 * section.
 */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`factory-container ${className}`}>{children}</div>;
}
