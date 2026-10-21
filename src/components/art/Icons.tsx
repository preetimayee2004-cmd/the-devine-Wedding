import type { ReactNode } from "react";
import type { EventIcon, Motif, TravelKind } from "@/config/types";

/** Fine gold line icons, drawn on a 24-unit grid in the current text colour. */
const GLYPHS: Record<Motif | EventIcon | TravelKind | UiGlyph, ReactNode> = {
  // ── motifs ──
  lotus: (
    <>
      <path d="M12 19c-2.6-2.2-2.8-7 0-11 2.8 4 2.6 8.8 0 11Z" />
      <path d="M11.2 19c-4.2.2-7.6-2.6-8.2-6.6 3.9.2 7 2.8 8.2 6.6ZM12.8 19c4.2.2 7.6-2.6 8.2-6.6-3.9.2-7 2.8-8.2 6.6Z" />
      <path d="M6 20.8h12" />
    </>
  ),
  diya: (
    <>
      <path d="M3.5 14.5h17c-1 3.5-4.5 5-8.5 5s-7.5-1.5-8.5-5Z" />
      <path d="M12 4c2.2 2.4 2.6 4.6 0 7.5-2.6-2.9-2.2-5.1 0-7.5Z" />
      <path d="M12 11.5v3" />
    </>
  ),
  kalash: (
    <>
      <path d="M7.5 11.5c-2.3 2.2-2 6 .8 8h7.4c2.8-2 3.1-5.8.8-8Z" />
      <path d="M9 11.5V9.6h6v1.9" />
      <path d="M9 9.6C7 9 5.8 7.4 5.6 5.8c2 .1 3.4 1.2 4.1 3M15 9.6c2-.6 3.2-2.2 3.4-3.8-2 .1-3.4 1.2-4.1 3" />
      <circle cx="12" cy="6.2" r="2" />
      <path d="M8 15h8" />
    </>
  ),
  crescent: (
    <>
      <path d="M5 10a7 7 0 0 0 14 0 8.5 8.5 0 0 1-14 0Z" />
      <circle cx="12" cy="5.5" r="1" />
    </>
  ),
  knot: (
    <>
      <path d="M12 11c-2-3-6.5-3-6.5 0s4.5 3 6.5 0 6.5-3 6.5 0-4.5 3-6.5 0Z" />
      <path d="M7 13.4 5 19M17 13.4l2 5.6" />
    </>
  ),

  // ── ceremonies ──
  mehendi: (
    <>
      <path d="M14.5 4c3.5 1.5 5.5 5.5 4.5 9.5-1 4.2-5.5 6.8-9.6 5.6-3-.9-4.6-4-3.2-6.6 1.3-2.4 4.6-2.8 6.1-.8 1 1.4.6 3.2-.9 3.7" />
      <path d="M14.5 4c-1.1 1.6-1.4 3.2-.9 5" />
      <circle cx="16" cy="11" r=".6" />
      <circle cx="15" cy="15.2" r=".6" />
    </>
  ),
  sangeet: (
    <>
      <path d="M4 8.5C4 7.1 7.6 6 12 6s8 1.1 8 2.5v7c0 1.4-3.6 2.5-8 2.5s-8-1.1-8-2.5Z" />
      <path d="M4 8.5C4 9.9 7.6 11 12 11s8-1.1 8-2.5" />
      <path d="m6.5 10.5 2.5 7 3-6.8 3 6.8 2.5-7" />
    </>
  ),
  haldi: (
    <>
      <path d="M3.5 12h17c0 4-3.8 7-8.5 7s-8.5-3-8.5-7Z" />
      <path d="M7 12c.8-2.6 2.8-4 5-4s4.2 1.4 5 4" />
      <path d="M16 6.8c1.5-2 3.5-2.5 5-2-.5 1.8-2.4 3-5 2Z" />
    </>
  ),
  baraat: (
    <>
      <path d="M3 11c1.5-4.5 5-7 9-7s7.5 2.5 9 7" />
      <path d="M3 11c1 1 2 1 3 0 1 1 2 1 3 0 1 1 2 1 3 0 1 1 2 1 3 0 1 1 2 1 3 0 1 1 2 1 3 0" />
      <path d="M12 11v9c0 1-1.6 1-1.6 0M12 4V2.4" />
    </>
  ),
  welcome: (
    <>
      <ellipse cx="12" cy="16" rx="9" ry="2.6" />
      <path d="M9 13.4c.6 1.2 5.4 1.2 6 0Z" />
      <path d="M12 5.6c1.6 1.8 1.8 3.5 0 5.4-1.8-1.9-1.6-3.6 0-5.4Z" />
    </>
  ),
  sindoor: (
    <>
      <path d="M5 13.5h14l-1.2 5.5H6.2Z" />
      <path d="M5 13.5C5 10.3 8.1 8 12 8s7 2.3 7 5.5" />
      <path d="M12 8V6.2" />
      <circle cx="12" cy="5.2" r="1" />
      <circle cx="12" cy="16.2" r=".7" />
    </>
  ),
  bidaai: (
    <>
      <path d="M2 12h20" />
      <path d="m6 12 1.5-4h9l1.5 4M12 8V6" />
      <path d="M7 12v6.5h10V12" />
      <path d="M10 18.5V15a2 2 0 0 1 4 0v3.5" />
    </>
  ),
  reception: (
    <>
      <path d="M12 3.5c1.4 1.5 1.6 3 0 4.8-1.6-1.8-1.4-3.3 0-4.8Z" />
      <path d="M8 10h8c0 1.6-1.8 2.6-4 2.6S8 11.6 8 10Z" />
      <path d="M12 12.6V18M8.5 20.5h7l-1-2.5h-5Z" />
    </>
  ),

  // ── travel ──
  air: (
    <path d="M21 11.5c0-.8-.7-1.5-1.5-1.5H15L10 3H8l2.5 7H5.5L4 8H2.5l1 3.5-1 3.5H4l1.5-2h5L8 20h2l5-7h4.5c.8 0 1.5-.7 1.5-1.5Z" />
  ),
  rail: (
    <>
      <path d="M7 3h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2ZM5 10h14" />
      <circle cx="8.5" cy="13.5" r=".6" />
      <circle cx="15.5" cy="13.5" r=".6" />
      <path d="m8 17-2 4M16 17l2 4" />
    </>
  ),
  bus: (
    <>
      <path d="M5 4h14a1 1 0 0 1 1 1v12H4V5a1 1 0 0 1 1-1ZM4 11h16M7 17v2.5M17 17v2.5" />
      <circle cx="7.5" cy="14" r=".6" />
      <circle cx="16.5" cy="14" r=".6" />
    </>
  ),
  local: (
    <>
      <path d="M3 16v-6c0-2.5 2-4.5 4.5-4.5H13l4 5h2.5c.8 0 1.5.7 1.5 1.5V16H3ZM8.5 5.5v5h8.5" />
      <circle cx="7" cy="17" r="1.8" />
      <circle cx="17" cy="17" r="1.8" />
    </>
  ),

  // ── interface ──
  pin: (
    <>
      <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  phone: (
    <path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 5 5.1a1.5 1.5 0 0 1 1.5-1.6Z" />
  ),
  chat: <path d="m4 20 1.3-3.8A8 8 0 1 1 8 19Z" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </>
  ),
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  bed: <path d="M3 18V6M3 14h18v4M21 14v-2.5a3 3 0 0 0-3-3h-7v5.5M7 11.2a1.7 1.7 0 1 0 0-.01" />,
  route: <path d="M6 19a2 2 0 1 0 0-.01M18 7a2 2 0 1 0 0-.01M6 17V9a3 3 0 0 1 6 0v6a3 3 0 0 0 6 0V9" />,
};

type UiGlyph = "pin" | "phone" | "chat" | "calendar" | "external" | "heart" | "bed" | "route";
export type IconName = keyof typeof GLYPHS;

export function Icon({
  name,
  className = "h-6 w-6",
  strokeWidth = 1.3,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {GLYPHS[name]}
    </svg>
  );
}
