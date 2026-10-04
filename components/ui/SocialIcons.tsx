import type { SocialLink } from "@/lib/social";

/**
 * Brand glyphs for the footer social row. Facebook and X are the official
 * Simple Icons marks; Justdial is the "Jd" lettermark cropped from the official
 * Justdial logotype. All are decorative (aria-hidden) — the accessible name
 * lives on the surrounding link/wrapper.
 */
const ICONS: Record<SocialLink["id"], { viewBox: string; node: React.ReactNode }> = {
  facebook: {
    viewBox: "0 0 24 24",
    node: (
      <path
        fill="#1877F2"
        d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
      />
    ),
  },
  x: {
    viewBox: "0 0 24 24",
    node: (
      <path
        fill="currentColor"
        d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
      />
    ),
  },
  justdial: {
    viewBox: "0 0 210 154",
    node: (
      <>
        <path
          fill="#1274C0"
          d="M77.1,18.5c0-9.5-6.2-14.8-14.6-14.8c-8.4,0-14.6,5.3-14.6,14.8v91.7c0,6.1,0,16-10.9,16c-8.8,0-15.6-7-23.4-7c-6.4,0-10.9,6.5-10.9,11.6c0,16.5,22.4,21.7,35.9,21.7c17.7,0,38.6-8.4,38.6-40.3V18.5L77.1,18.5z"
        />
        <path
          fill="#FF6C00"
          transform="translate(-224 0)"
          d="M409.9,17.8c0-9.1-5.9-15.2-14.2-15.2c-8.3,0-14.2,6.1-14.2,15.2V55c-7.5-6.3-17.1-9.5-27-9.5c-30.5,0-45.7,27.6-45.7,54.2c0,25.8,18.1,51.5,46.7,51.5c9.7,0,20.7-4.2,26-12.6c1.8,7.2,6.3,11.4,14.2,11.4c8.3,0,14.2-6.1,14.2-15.2V17.8L409.9,17.8z M381.5,97.6c0,13.3-6.7,28.5-22.3,28.5c-14.8,0-22.1-14.8-22.1-27.6c0-12.9,7.3-27.9,22.1-27.9C374.4,70.6,381.5,84.3,381.5,97.6L381.5,97.6z"
        />
      </>
    ),
  },
};

export function SocialIcon({ id }: { id: SocialLink["id"] }) {
  const icon = ICONS[id];
  return (
    <svg
      viewBox={icon.viewBox}
      className="h-7 w-auto"
      aria-hidden="true"
      focusable="false"
    >
      {icon.node}
    </svg>
  );
}
