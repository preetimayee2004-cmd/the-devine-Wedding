import { EASE } from "@/lib/motion";

/** Small gold divider: two fine lines drawing outward from a lotus bud. */
export function OrnamentDivider({ show, delay = 0, className = "" }: { show: boolean; delay?: number; className?: string }) {
  const line = (origin: "left" | "right") => ({
    transformOrigin: origin,
    transform: show ? "scaleX(1)" : "scaleX(0)",
    transition: `transform 1100ms ${EASE.silk} ${delay + 150}ms`,
  });
  return (
    <div aria-hidden className={`flex items-center justify-center gap-2 ${className}`}>
      <span className="block h-px w-16 bg-gradient-to-l from-gold to-transparent" style={line("right")} />
      <svg
        viewBox="0 0 24 14"
        className="h-3.5 w-6"
        style={{ opacity: show ? 1 : 0, transition: `opacity 600ms ease-out ${delay}ms` }}
      >
        <g fill="rgb(var(--gold) / 0.35)" stroke="rgb(var(--gold-ink))" strokeWidth="0.8" strokeLinejoin="round">
          <path d="M12 12.5C9.6 10.6 9.4 6 12 2.5c2.6 3.5 2.4 8.1 0 10Z" />
          <path d="M11.4 12.5C7.6 12.6 4.6 10.2 4 6.6c3.5.2 6.4 2.6 7.4 5.9ZM12.6 12.5c3.8.1 6.8-2.3 7.4-5.9-3.5.2-6.4 2.6-7.4 5.9Z" />
        </g>
      </svg>
      <span className="block h-px w-16 bg-gradient-to-r from-gold to-transparent" style={line("left")} />
    </div>
  );
}
