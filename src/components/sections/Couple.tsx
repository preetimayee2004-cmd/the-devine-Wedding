import { wedding } from "@/config/wedding";

/**
 * Section 02 — one screen of the site's sky with a toran across its top:
 * mango leaves and marigold strings, jasmine garlands hanging down either
 * side, like a decorated doorway. It keeps its id because "View the
 * Invitation" and the Save the Date's auto-glide land here.
 */
export function Couple() {
  const { toran, toranSize } = wedding.assets;
  return (
    // the toran starts just below the status bar / notch, when there is one
    <section id="couple" className="min-h-screen pt-[var(--status-bar)]">
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
    </section>
  );
}
