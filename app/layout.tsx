import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { seo } from "@/lib/seo";
import { business } from "@/lib/business";
import { buildLocalBusinessSchema } from "@/lib/schema";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata is centralized here, sourced from lib/seo.ts. See
// docs/MASTER-GYM-SEO-CONTRACT.md. Never duplicate these values in page
// components.
export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  metadataBase: new URL(seo.canonical),
  alternates: {
    canonical: seo.canonical,
  },
  robots: seo.robots,
  openGraph: seo.ogImage
    ? {
        title: seo.title,
        description: seo.description,
        images: [seo.ogImage],
      }
    : undefined,
};

// Structured data built from verified business fields only. See
// docs/MASTER-GYM-SEO-CONTRACT.md and lib/schema.ts.
const localBusinessSchema = buildLocalBusinessSchema({
  schemaType: "ExerciseGym",
  name: business.name,
  address: business.address,
  telephone: business.phone,
  url: seo.canonical,
  image: seo.ogImage ?? "",
  openingHours: business.hours,
  sameAs: undefined,
  geo: undefined,
  priceRange: undefined,
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The only per-gym visual token: accent color from lib/business.ts.
      // See docs/MASTER-GYM-WEBSITE-ARCHITECTURE.md — accent never alters
      // typography, spacing, layout, or component shape.
      style={{ "--accent": business.accentColor } as CSSProperties}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </body>
    </html>
  );
}
