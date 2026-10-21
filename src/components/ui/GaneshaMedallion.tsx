import { EASE } from "@/lib/motion";
import { Ganpati } from "@/components/art/Ganpati";

/** Ganpati inside a fine gold double ring: the ring opens, then he draws himself. */
export function GaneshaMedallion({ show, still, delay = 0 }: { show: boolean; still: boolean; delay?: number }) {
  const dots = [0, 90, 180, 270].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return [50 + 46 * Math.sin(rad), 50 - 46 * Math.cos(rad)];
  });
  return (
    <div className="relative h-[92px] w-[92px] shrink-0">
      <svg
        viewBox="0 0 100 100"
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{
          opacity: show ? 1 : 0,
          transform: show || still ? "scale(1)" : "scale(0.6)",
          transition: `opacity 700ms ease-out ${delay}ms, transform 1000ms ${EASE.silk} ${delay}ms`,
        }}
      >
        <circle cx="50" cy="50" r="40" fill="rgb(var(--ivory) / 0.75)" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgb(var(--gold))" strokeWidth="0.9" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgb(var(--gold))" strokeWidth="0.5" opacity="0.7" />
        {dots.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="rgb(var(--gold))" />
        ))}
      </svg>
      <Ganpati
        drawn={show}
        still={still}
        delay={still ? 0 : delay + 250}
        className="absolute left-1/2 top-1/2 w-[64px] -translate-x-1/2 -translate-y-[52%]"
      />
    </div>
  );
}
