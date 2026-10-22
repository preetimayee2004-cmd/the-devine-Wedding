import { wedding } from "@/config/wedding";

/**
 * Section 02 — one screen, in the style of the couple's chosen painting, on
 * the site's own sky: a carved arch with temple bells and jasmine strings
 * across the top, and at the foot the couple offering water to the
 * Shivling, by the river with a temple, a diya and lotuses. No text. It keeps
 * its id because "View the Invitation" and the Save the Date's auto-glide
 * land here.
 */
export function Couple() {
  const { coupleArch, coupleArchSize, coupleScene, coupleSceneSize } = wedding.assets;
  return (
    // it starts right where the Save the Date ends — no gap
    <section id="couple" className="couple-scene flex flex-col justify-between">
      <img
        src={coupleArch}
        alt=""
        aria-hidden
        width={coupleArchSize.width}
        height={coupleArchSize.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="pointer-events-none block h-auto w-full select-none"
      />
      <img
        src={coupleScene}
        alt="The couple offering water to the Shivling by the river, a temple behind them"
        width={coupleSceneSize.width}
        height={coupleSceneSize.height}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="couple-scene-foot pointer-events-none block h-auto w-full select-none"
      />
    </section>
  );
}
