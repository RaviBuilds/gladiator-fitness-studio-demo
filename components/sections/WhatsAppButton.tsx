"use client";

import { useEffect, useState } from "react";

/**
 * Floating WhatsApp CTA. Persistent but deliberately quiet: a squared tile on
 * the same 20px frame margin as the hero's scroll marker, no shadow, no glow
 * and no continuous pulsing — one entrance animation only, so it never
 * competes with the header CTA, the hero CTA or the headline artwork.
 */
export function WhatsAppButton({ href }: { href: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`factory-focus fixed bottom-5 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-[2px] bg-(--success) text-white transition-opacity hover:opacity-90 ${
        mounted ? "factory-pop-in" : "opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.94.55 3.75 1.5 5.29L2 22l4.94-1.6a9.85 9.85 0 0 0 5.1 1.4h.01c5.46 0 9.9-4.45 9.9-9.9C21.96 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.42 1.3-1.96 1.38-.5.08-1.14.11-1.84-.12-.42-.14-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.93-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .55.01.18.01.42-.07.65.5.24.58.81 2 .88 2.15.07.14.12.31.02.5-.09.19-.15.31-.29.47-.14.16-.29.36-.42.48-.14.14-.29.29-.12.58.16.29.75 1.24 1.62 2.02 1.12.99 2.06 1.3 2.37 1.44.31.14.49.12.67-.07.19-.19.79-.9.99-1.21.2-.31.4-.26.67-.16.27.1 1.68.79 1.97.93.29.14.48.21.55.33.07.12.07.68-.17 1.36z" />
      </svg>
    </a>
  );
}
