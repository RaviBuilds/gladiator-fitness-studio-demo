"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

const SESSION_KEY = "factory-contact-dialog-shown";
const TRIGGER_SELECTOR = "#transformations";

/**
 * Mid-scroll optional contact dialog. Appears once per session after the
 * visitor reaches the Transformations section (or roughly mid-page if that
 * section is absent), gated by sessionStorage, accessible with focus
 * restore and Escape-to-close, compact bottom sheet on mobile.
 */
export function ContactDialog({
  whatsappHref,
  image,
  imageAlt,
}: {
  whatsappHref: string;
  image?: string;
  imageAlt?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const target =
      document.querySelector(TRIGGER_SELECTOR) ?? document.querySelector("#reviews");
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setOpen(true);
            sessionStorage.setItem(SESSION_KEY, "1");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (open) {
      triggerElementRef.current = document.activeElement as HTMLElement;
      dialogRef.current?.focus();
    } else if (triggerElementRef.current) {
      triggerElementRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close dialog"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/70"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-dialog-title"
        tabIndex={-1}
        className="factory-dialog-in factory-focus relative z-10 flex w-full max-w-lg flex-col gap-4 border border-(--border) bg-(--surface-elevated) p-6 sm:m-6 sm:flex-row sm:gap-6"
      >
        {image && (
          <div className="relative hidden h-32 w-32 shrink-0 overflow-hidden sm:block">
            <Image src={image} alt={imageAlt ?? ""} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1">
          <h2 id="contact-dialog-title" className="text-xl font-semibold text-(--text-primary)">
            Still deciding?
          </h2>
          <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
            Send us a message on WhatsApp and we&apos;ll answer any question about training or membership.
          </p>
          <div className="mt-4 flex gap-3">
            <Button href={whatsappHref} variant="primary" className="flex-1 justify-center">
              Chat on WhatsApp
            </Button>
            <button
              onClick={() => setOpen(false)}
              className="factory-focus px-4 text-sm text-(--text-secondary) hover:text-(--text-primary)"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
