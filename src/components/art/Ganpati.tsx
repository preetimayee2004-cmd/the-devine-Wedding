import { useId } from "react";
import { EASE } from "@/lib/motion";

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;

/** Gold line drawing of Lord Ganesha, in drawing order (crown → ears → face → trunk). */
const STROKES = [
  // mukut
  "M38.5 31C38.5 24.5 41.5 20 45.5 17.5C46.5 13 48.2 10 50 7C51.8 10 53.5 13 54.5 17.5C58.5 20 61.5 24.5 61.5 31",
  "M37.5 31H62.5",
  "M40 26.5q2.5-2 5 0q2.5-2 5 0q2.5-2 5 0q2.5-2 5 0",
  "M45.5 17.5Q50 16.2 54.5 17.5",
  circle(50, 4.6, 1.1),
  circle(50, 22, 1.3),
  // ears
  "M38.5 35C27 27 10.5 31 10.5 47.5C10.5 60 20 67.5 31 66.5C34 66.2 36.6 64.6 38.6 62.4",
  "M61.5 35C73 27 89.5 31 89.5 47.5C89.5 60 80 67.5 69 66.5C66 66.2 63.4 64.6 61.4 62.4",
  "M38.2 41C30 38 18 40 18 49C18 56.5 25 60.5 33 59.6C35.4 59.3 37.4 58.4 38.8 57.2",
  "M61.8 41C70 38 82 40 82 49C82 56.5 75 60.5 67 59.6C64.6 59.3 62.6 58.4 61.2 57.2",
  // face
  "M38.5 31C37.6 41 38.2 53 41.5 61",
  "M61.5 31C62.4 41 61.8 53 58.5 61",
  // tripundra — Shiva's mark on his son's brow
  "M44.5 34.6H55.5M45 37.2H55M45.8 39.8H54.2",
  // eyes, lowered in meditation
  "M40.6 46Q43.4 43.8 46.2 46",
  "M53.8 46Q56.6 43.8 59.4 46",
  // trunk, curling to the left, and its folds
  "M46.6 49.5C46.2 59 46.4 67 43.8 74C41.8 79 37.4 81 34.9 79C33 77.4 33.7 74.5 36 74.1",
  "M53.4 49.5C54.4 61 54 73 49 81.5C44.6 88.6 34.6 89.8 30.1 84.8C26.7 81 28.6 74.5 34 73.6C35 73.5 35.7 73.7 36 74.1",
  "M47 57.5Q50 58.6 53.6 57.5M46.9 63.5Q50 64.6 53.6 63.5M46.2 69.5Q49.5 70.6 53.2 69.4",
  // tusk
  "M56 58.5C59.4 59.8 61.6 62.6 61.3 66.4",
];

interface GanpatiProps {
  /** Lines draw themselves in when this turns true. */
  drawn: boolean;
  /** Skip the line drawing (reduced motion): fade in whole. */
  still?: boolean;
  delay?: number;
  className?: string;
}

export function Ganpati({ drawn, still = false, delay = 0, className }: GanpatiProps) {
  const gold = useId();
  return (
    <svg viewBox="0 0 100 92" className={className} role="img" aria-label="Lord Ganesha">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B08A4A" />
          <stop offset="1" stopColor="rgb(var(--gold-ink))" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={still ? { opacity: drawn ? 1 : 0, transition: `opacity 500ms linear ${delay}ms` } : undefined}
      >
        {STROKES.map((d, i) => {
          const wait = delay + i * 45;
          return (
            <path
              key={i}
              d={d}
              pathLength={1}
              style={
                still
                  ? undefined
                  : {
                      strokeDasharray: "1 1",
                      strokeDashoffset: drawn ? 0 : 1,
                      opacity: drawn ? 1 : 0,
                      transition: `stroke-dashoffset 1200ms ${EASE.silk} ${wait}ms, opacity 1ms linear ${wait}ms`,
                    }
              }
            />
          );
        })}
      </g>
    </svg>
  );
}
