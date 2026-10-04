import type { Metadata } from "next";
import { business } from "@/lib/business";
import { services } from "@/lib/services";
import { seo } from "@/lib/seo";
import { contactDirectory } from "@/lib/contact";
import { first30DaysConfiguration } from "@/lib/first-30-days";
import { fitnessTools } from "@/lib/fitness-tools";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { First30Days } from "@/components/motion/First30Days";

const PAGE_TITLE = `Plan Your First 30 Days | ${business.name}`;
const PAGE_DESCRIPTION = `A few quick questions, then a realistic first month at ${business.name}: what to sort before Day 1, what a first visit could look like and a weekly rhythm that fits your week.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${seo.canonical.replace(/\/$/, "")}/first-30-days` },
  robots: seo.robots,
  openGraph: seo.ogImage
    ? {
        title: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        images: [seo.ogImage],
      }
    : undefined,
};

/**
 * /first-30-days — "Plan Your First 30 Days".
 *
 * The site's third interactive tool. /start answers "where should I start?",
 * /journey "what could my path look like?"; this one answers "how will my
 * first month actually work?" — a realistic weekly rhythm, a first visit, one
 * plan for when it gets hard and a clear next action. It is an onboarding
 * plan, never a workout, calorie, membership or medical tool.
 *
 * Source-First / reuse: every gym fact is passed in from lib/*.ts — name,
 * WhatsApp and hours from lib/business.ts, verified service ids from
 * lib/services.ts, the call link from lib/contact.ts, images, onboarding
 * capabilities and first-visit facts from lib/first-30-days.ts, and the
 * source-tool names for the optional handoff from lib/fitness-tools.ts. The
 * client component and its logic module (components/sections/
 * first30DaysLogic.ts) contain no gym-specific value.
 */
export default function First30DaysPage() {
  const whatsappHref = buildWhatsAppHref(business.whatsapp);
  const callHref = contactDirectory(business).find((e) => e.id === "phone")?.href;
  const verifiedServiceIds = services.filter((s) => s.verified).map((s) => s.id);
  const toolName = (id: string) => fitnessTools.find((t) => t.id === id)?.name ?? "";

  return (
    <div id="top">
      <Header whatsappHref={whatsappHref} />

      <main>
        <First30Days
          whatsapp={business.whatsapp}
          gymName={business.name}
          hours={business.hours}
          callHref={callHref}
          membershipHref="/#membership"
          startHref="/start"
          config={first30DaysConfiguration}
          verifiedServiceIds={verifiedServiceIds}
          sourceNames={{ start: toolName("starting-point"), journey: toolName("journey") }}
        />
      </main>

      <Footer />
    </div>
  );
}
