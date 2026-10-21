import { useId } from "react";

/**
 * Soft watercolour Himalaya behind the couple, drawn tall so the peaks rise
 * above their shoulders: a far range, a snowy peak on the left, Kailash's
 * banded dome on the right, a small peak between, nearer snow hills, and a
 * still lake with lotuses. Fits its box's width, anchored to the bottom.
 */
export function Kailash({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 400 420" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d3e4f1" />
          <stop offset="1" stopColor="#bcd4e7" />
        </linearGradient>
        <linearGradient id={`${id}snow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3eef6" />
        </linearGradient>
        <linearGradient id={`${id}lake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6f1fb" />
          <stop offset="1" stopColor="#a3dbf0" />
        </linearGradient>
        <linearGradient id={`${id}mist`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
        </linearGradient>
        {/* a slightly hand-painted edge */}
        <filter id={`${id}paint`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="5" />
          <feDisplacementMap in="SourceGraphic" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g filter={`url(#${id}paint)`} stroke="#a9c6dc" strokeWidth="0.8" strokeLinejoin="round">
        {/* far range */}
        <path
          fill={`url(#${id}far)`}
          d="M0 230 20 206l24 8 26-34 24 16 24-26 24 20 28-30 26 22 26-24 26 20 24-28 28 22 26-22 26 26 26-16 22 12v248H0Z"
        />
        {/* a small peak between, mostly behind the couple */}
        <path fill={`url(#${id}snow)`} d="M150 362 190 250q10-24 16-30 8 12 18 34l38 108Z" />
        {/* the snowy peak on the left */}
        <path fill={`url(#${id}snow)`} d="M-10 362 58 200q24-80 38-108 14 28 34 94l66 176Z" />
        <path fill="#bcd4e6" stroke="none" d="M96 92q14 28 34 94l66 176h-46q-28-162-54-270Z" />
        <path
          fill="none"
          stroke="#bcd4e6"
          strokeWidth="1.2"
          strokeLinecap="round"
          d="M84 150q8 14 4 36M70 190q8 10 4 26"
        />
        {/* Kailash's dome on the right, with its snow bands */}
        <path fill={`url(#${id}snow)`} d="M206 362 266 200q22-90 40-122 12-12 24 0 18 32 40 122l50 162Z" />
        <path fill="#bcd4e6" stroke="none" d="M318 72q6 0 12 6 18 32 40 122l50 162h-56q-24-176-46-290Z" />
        <path
          fill="none"
          stroke="#bcd4e6"
          strokeWidth="1.3"
          strokeLinecap="round"
          d="M296 120q22 9 44 0M286 152q32 12 64 0M276 186q42 15 84 0"
        />
        {/* nearer snow hills */}
        <path fill="#ffffff" d="M0 372 36 328l26 14 34-36 30 28 26-12 38 44v54H0Z" />
        <path fill="#c9dcea" stroke="none" d="M96 306l30 28 26-12 38 44h-48Z" />
        <path fill="#ffffff" d="M214 368 250 326l26 14 30-36 34 26 26-14 34 24v80H214Z" />
        <path fill="#c9dcea" stroke="none" d="M306 304l34 26 26-14 34 24v16l-56-18Z" />
      </g>

      {/* the lake, its misty shore, and lotuses */}
      <rect x="0" y="366" width="400" height="54" fill={`url(#${id}lake)`} />
      <rect x="0" y="350" width="400" height="22" fill={`url(#${id}mist)`} />
      <path
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.7"
        strokeWidth="0.8"
        strokeLinecap="round"
        d="M24 392h40M86 404h30M282 396h46M330 408h28"
      />
      {[
        [44, 396],
        [96, 410],
        [306, 402],
        [358, 392],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <ellipse cx="0" cy="3" rx="9" ry="2.4" fill="#86bf95" opacity="0.85" />
          <path fill="#f3b8c4" d="M0 2C-2-1-2-4 0-7c2 3 2 6 0 9Z" />
          <path fill="#f7cdd5" d="M-.5 2.3C-4 2-6 0-6.5-3c3 .3 5.5 2 6 5.3ZM.5 2.3C4 2 6 0 6.5-3c-3 .3-5.5 2-6 5.3Z" />
        </g>
      ))}
    </svg>
  );
}
