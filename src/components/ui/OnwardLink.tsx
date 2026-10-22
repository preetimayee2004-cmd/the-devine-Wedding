import type { CSSProperties, MouseEvent } from "react";

/**
 * "View the Invitation" with a gently bobbing double arrow under it: a tap
 * glides on to the next section (smoothly, via scroll-behavior on <html>).
 */
export function OnwardLink({
  to,
  label,
  devanagari,
  style,
}: {
  /** id of the section to glide to */
  to: string;
  label: string;
  devanagari?: boolean;
  style?: CSSProperties;
}) {
  const onClick = (e: MouseEvent) => {
    const next = document.getElementById(to);
    if (!next) return;
    e.preventDefault(); // no #id left in the address, so a reload still starts at the opening
    next.scrollIntoView();
  };
  return (
    <a
      href={`#${to}`}
      onClick={onClick}
      className="pointer-events-auto flex min-h-[44px] flex-col items-center justify-center px-4 pt-1 text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.5)]"
      style={style}
    >
      <span className={`text-[13px] font-semibold ${devanagari ? "font-deva" : "font-display uppercase tracking-[0.24em]"}`}>
        {label}
      </span>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="std-arrows mt-0.5"
        aria-hidden
      >
        <path d="M7 6.5l5 5 5-5M7 12.5l5 5 5-5" />
      </svg>
    </a>
  );
}
