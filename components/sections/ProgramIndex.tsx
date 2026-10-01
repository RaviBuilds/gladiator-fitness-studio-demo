"use client";

import Image from "next/image";
import { useState } from "react";
import type { Service } from "@/lib/types";
import type { TrainingIconName } from "@/lib/types";
import { TrainingIcon } from "@/components/ui/TrainingIcon";
import { Button } from "@/components/ui/Button";

/**
 * Section 02 program list + active preview panel.
 *
 * A `Service.icon` is a free string in the data contract (not the closed
 * `TrainingIconName` union), so this map translates the small set of icon
 * keys used by the master demo data onto the existing Section 01 icon
 * system. No new icon library, no new icon set — same five geometric marks.
 * An unrecognised key safely falls back to "floor".
 */
const ICON_MAP: Record<string, TrainingIconName> = {
  dumbbell: "strength",
  strength: "strength",
  flame: "cardio",
  cardio: "cardio",
  target: "coaching",
  coaching: "coaching",
  users: "equipment",
  group: "equipment",
  equipment: "equipment",
};

function resolveIcon(icon: string): TrainingIconName {
  return ICON_MAP[icon] ?? "floor";
}

/**
 * Client component: the only part of Section 02 that needs interaction
 * state (which row's image is active). Everything else in Programs.tsx
 * stays a Server Component.
 *
 * Desktop/tablet (lg+): a ruled program index on the left, a single tall
 * preview panel on the right that crossfades to whichever row is
 * hovered/focused/pressed. Below lg: no shared panel (no room for it), each
 * row carries its own compact inline image instead, so the section stays
 * dense on mobile rather than leaving a huge empty gap.
 *
 * Hover AND focus both set the active row, so the image relationship has a
 * full keyboard equivalent — a sighted mouse user and a keyboard user reach
 * the same state. Active state is a rule + text-contrast step, never a
 * zoom/bounce/glow.
 */
export function ProgramIndex({
  programs,
  whatsappHref,
}: {
  programs: Service[];
  whatsappHref: string;
}) {
  const [activeId, setActiveId] = useState(programs[0]?.id);
  const active = programs.find((p) => p.id === activeId) ?? programs[0];
  const count = String(programs.length).padStart(2, "0");

  return (
    <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-12">
      {/* ---------- Program index (ruled list) ---------- */}
      <div className="lg:col-span-7">
        <div className="flex items-baseline justify-between gap-4 border-b border-(--border) pb-3">
          <h3 className="factory-group-label">Training modes</h3>
          <span className="factory-index" aria-hidden="true">
            {count}
          </span>
        </div>

        <ul>
          {programs.map((program, i) => {
            const isActive = program.id === active?.id;
            return (
              <li key={program.id}>
                <div
                  className="factory-program-row factory-stagger-child"
                  data-active={isActive || undefined}
                  style={{ transitionDelay: `${100 + i * 70}ms` }}
                  onMouseEnter={() => setActiveId(program.id)}
                  onFocus={() => setActiveId(program.id)}
                >
                  <span className="factory-program-index" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <TrainingIcon
                    name={resolveIcon(program.icon)}
                    className="factory-program-icon"
                  />

                  <div className="min-w-0 flex-1">
                    <h4 className="factory-program-name">{program.name}</h4>
                    <p className="factory-program-desc">{program.description}</p>

                    {/* Mobile/tablet-only inline preview — no shared panel
                        below lg, so each row carries its own image instead
                        of leaving empty space. Own editorial treatment
                        (clipped bottom-left corner + offset hairline +
                        technical index chip) distinct from Section 01's
                        top-right notch frame, so the two sections read as
                        related but not identical systems. */}
                    {program.image && (
                      <div className="factory-program-inline-frame lg:hidden">
                        <span
                          aria-hidden="true"
                          className="factory-program-inline-outline"
                        />
                        <div className="factory-program-inline-image factory-frame-notch-alt">
                          <Image
                            src={program.image}
                            alt={`${program.name} training at the gym`}
                            fill
                            loading="lazy"
                            sizes="100vw"
                            className="object-cover"
                          />
                        </div>
                        <span className="factory-program-inline-tag">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                    )}

                    {program.ctaLabel && (
                      <Button
                        href={program.ctaHref ?? whatsappHref}
                        variant="ghost"
                        className="mt-4 px-0 text-xs"
                      >
                        {program.ctaLabel} →
                      </Button>
                    )}
                  </div>

                  <span className="factory-program-arrow" aria-hidden="true">
                    &rarr;
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ---------- Active preview panel (lg and up only) ----------
          The panel is sticky on desktop. That is implemented in
          .factory-program-panel (app/globals.css) and NOT with Tailwind's
          `sticky`/`top-*` utilities: globals.css is unlayered and Tailwind
          utilities are in @layer utilities, so the component's own
          `position: relative` would win and the panel would not stick.
          This wrapper deliberately has no `relative` of its own — it is the
          sticky element's containing block and bounds its travel to this
          column, keeping it inside Section 02. */}
      <div className="hidden lg:col-span-5 lg:block">
        <div className="factory-program-panel">
          {programs.map((program) => {
            if (!program.image) return null;
            const isActive = program.id === active?.id;
            return (
              <div
                key={program.id}
                className="factory-program-panel-image"
                data-active={isActive || undefined}
                aria-hidden={!isActive}
              >
                <Image
                  src={program.image}
                  alt={`${program.name} training at the gym`}
                  fill
                  loading="lazy"
                  sizes="40vw"
                  className="object-cover"
                />
              </div>
            );
          })}

          {/* Technical caption riding the panel — echoes Section 01's frame
              chip, so the two sections read as the same system one level
              down, without repeating its frame/notch treatment. */}
          {active && (
            <span className="factory-meta-chip absolute bottom-4 right-4 z-10">
              {String(programs.findIndex((p) => p.id === active.id) + 1).padStart(2, "0")}
              {" / "}
              {active.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
