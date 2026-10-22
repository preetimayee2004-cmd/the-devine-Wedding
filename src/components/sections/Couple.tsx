import { wedding } from "@/config/wedding";

/**
 * Section 02 — one screen of the site's sky with a toran across its top:
 * mango leaves and marigold strings, jasmine garlands hanging down either
 * side, like a decorated doorway. At its foot, in the middle of the doorway,
 * the couple offer water to the Shivling. It keeps its id because "View the
 * Invitation" and the Save the Date's auto-glide land here.
 */
export function Couple() {
  const { toran, toranSize, coupleAbhishek, coupleAbhishekSize } = wedding.assets;
  return (
    // the toran starts just below the status bar / notch, when there is one
    <section id="couple" className="relative min-h-screen pt-[var(--status-bar)]">
      <img
        src={toran}
        alt=""
        aria-hidden
        width={toranSize.width}
        height={toranSize.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="pointer-events-none block h-auto w-full select-none"
      />
      {/* centred at the foot, sized to stand between the toran's two garlands */}
      <img
        src={coupleAbhishek}
        alt="The couple offering water to the Shivling together"
        width={coupleAbhishekSize.width}
        height={coupleAbhishekSize.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="pointer-events-none absolute bottom-4 left-1/2 h-auto w-[min(72vw,320px)] -translate-x-1/2 select-none"
      />
    </section>
  );
}
