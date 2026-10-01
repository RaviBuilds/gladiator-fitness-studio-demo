import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "factory-focus inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-colors duration-200";

const variants: Record<Variant, string> = {
  primary:
    "bg-(--accent) text-(--accent-foreground) hover:bg-(--accent-hover)",
  secondary:
    "border border-(--border) text-(--text-primary) hover:border-(--accent) hover:text-(--accent)",
  ghost: "text-(--text-primary) hover:text-(--accent) underline-offset-4 hover:underline",
};

/**
 * Same visual language as Button but renders a real <button type="submit">
 * for use inside forms (ContactForm). Kept separate from Button, which is
 * link-only, rather than overloading Button with a polymorphic `as` prop.
 */
export function SubmitButton({
  variant = "primary",
  children,
  className = "",
  disabled,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`${base} ${variants[variant]} disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Fixed CTA primitive. Accent-aware but shape/behavior never changes per
 * gym. External hrefs use a plain anchor; internal hrefs use next/link.
 */
export function Button({
  href,
  variant = "primary",
  children,
  className = "",
  ...rest
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">) {
  const classes = `${base} ${variants[variant]} ${className}`;
  const isExternal =
    href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");

  if (isExternal) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
