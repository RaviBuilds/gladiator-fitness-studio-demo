import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Master demo assets are locally-generated placeholder SVGs (no real
    // photography supplied yet). Local, trusted SVGs only — never remote.
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
  },
};

export default nextConfig;
