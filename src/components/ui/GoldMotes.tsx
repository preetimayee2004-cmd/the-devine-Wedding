import { useMemo, type CSSProperties } from "react";

/**
 * A few motes of gold light that drift outward from where the hands touched
 * and fade — a quiet release, not a burst. Each drifts once.
 */
export function GoldMotes({
  count = 14,
  pace = 1,
  at,
}: {
  count?: number;
  pace?: number;
  /** Where they start, within the parent (by default the middle of the screen, 46% down). */
  at?: { left: string; top: string };
}) {
  const motes = useMemo(() => {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + (rnd() - 0.5) * 0.6;
      const reach = 70 + rnd() * 120;
      return {
        // outward, with a gentle lift
        dx: Math.cos(angle) * reach,
        dy: Math.sin(angle) * reach * 0.85 - 24 - rnd() * 30,
        size: 3 + rnd() * 2.5,
        delay: rnd() * 380,
        duration: 2000 + rnd() * 900,
      };
    });
  }, [count]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute z-[6] h-0 w-0 ${at ? "" : "left-1/2 top-[46dvh]"}`}
      style={at}
    >
      {motes.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={
            {
              width: m.size,
              height: m.size,
              animationDelay: `${m.delay * pace}ms`,
              animationDuration: `${m.duration * pace}ms`,
              "--dx": `${m.dx}px`,
              "--dy": `${m.dy}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
