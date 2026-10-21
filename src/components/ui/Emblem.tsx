import { useId } from "react";

/**
 * The small gold emblem: Om within a fine double ring. The opening's glow
 * condenses into it, and it crowns the invitation (PRD §5, Preloader → Invitation).
 */
export function Emblem({ size = 60, className }: { size?: number; className?: string }) {
  const gold = useId();
  const dots = [0, 90, 180, 270].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return [32 + 29 * Math.sin(rad), 32 - 29 * Math.cos(rad)];
  });

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className={className}>
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9A15E" />
          <stop offset="1" stopColor="#8A642F" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill="none" stroke="rgb(var(--gold))" strokeWidth="1" />
      <circle cx="32" cy="32" r="25" fill="none" stroke="rgb(var(--gold))" strokeWidth="0.6" opacity="0.7" />
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="rgb(var(--gold))" />
      ))}
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontSize="27"
        fill={`url(#${gold})`}
        style={{ fontFamily: "var(--font-deva)" }}
      >
        ॐ
      </text>
    </svg>
  );
}
