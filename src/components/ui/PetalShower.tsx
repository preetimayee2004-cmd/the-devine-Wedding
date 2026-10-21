import { useMemo, type CSSProperties } from "react";

/**
 * A short shower of red petals (as in the reference): each petal falls once,
 * swaying and turning, and then the shower is over — no endless loop.
 */
export function PetalShower({ count = 18, spreadMs = 5200 }: { count?: number; spreadMs?: number }) {
  const petals = useMemo(() => {
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    return Array.from({ length: count }, (_, i) => ({
      left: 4 + rnd() * 92,
      delay: (i / count) * spreadMs + rnd() * 400,
      duration: 5200 + rnd() * 2600,
      sway: (rnd() - 0.5) * 90,
      spin: 160 + rnd() * 320,
      size: 8 + rnd() * 6,
    }));
  }, [count, spreadMs]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[100dvh] overflow-hidden">
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.7,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.duration}ms`,
              "--sway": `${p.sway}px`,
              "--spin": `${p.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
