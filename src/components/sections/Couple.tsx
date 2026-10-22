import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { wedding } from "@/config/wedding";
import { useGuest } from "@/context/GuestContext";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useLang } from "@/lib/lang";
import { directionsUrl } from "@/lib/maps";
import { EASE } from "@/lib/motion";
import { formatVenueDate, parseVenueDateTime } from "@/lib/venueTime";
import { Icon } from "@/components/art/Icons";
import { LangToggle } from "@/components/ui/LangToggle";
import { OnwardLink } from "@/components/ui/OnwardLink";

// a deeper gold for the hashtag, so it reads on the sky (every line also carries a soft white glow — index.css)
const HASHTAG = "#8a5a10";
const TOAST_MS = 1500;

/**
 * Section 02 — one screen, in the style of the couple's chosen painting, on
 * the site's own sky: a carved golden arch with gently swaying temple bells
 * and jasmine strings across the top, right where the Save the Date ends; on the sky
 * below the bells, the guest's welcome — their name from the link, the
 * couple's names, the hashtag (a tap copies it), the date and the venue (a
 * map link); and at the foot the couple offering water to the Shivling, by
 * the river with a temple, a diya and lotuses — always with clear sky above
 * their heads — with "View the Invitation" on a dark-navy panel, as on the
 * Save the Date. The words rise in one by one as the section comes into view.
 * It keeps its id because "View the Invitation" and the Save the Date's
 * auto-glide land here.
 */
export function Couple() {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { threshold: 0.25 });
  const reduced = usePrefersReducedMotion();
  const hindi = useLang() === "hi";
  const { guestName, isPersonalized } = useGuest();
  const { coupleWelcome: copy, invitation, couple, venue, assets } = wedding;
  const { coupleArch, coupleArchSize, coupleBells, coupleScene, coupleSceneSize } = assets;

  // "Dear {guest}," — the name set in bold; with no name in the link, "Dear Family & Friends,"
  const [dearBefore, dearAfter = ""] = copy.dear.split("{guest}");
  const guest = isPersonalized ? guestName.slice(0, 40) : copy.everyone;

  const date = useMemo(() => {
    const parts = parseVenueDateTime(wedding.wedding.dateTime);
    return parts ? formatVenueDate(parts) : null;
  }, []);

  // a tap on the hashtag copies it, and "Copied" shows for a moment
  const [copied, setCopied] = useState(false);
  const toast = useRef(0);
  useEffect(() => () => clearTimeout(toast.current), []);
  const copyHashtag = async () => {
    if (!(await copyText(copy.hashtag))) return;
    setCopied(true);
    clearTimeout(toast.current);
    toast.current = window.setTimeout(() => setCopied(false), TOAST_MS);
  };

  // one by one: fade in and rise 10px (700ms, 150ms apart); nothing moves for reduced motion
  const appear = (step: number): CSSProperties =>
    reduced
      ? {}
      : {
          opacity: seen ? 1 : 0,
          transform: seen ? "none" : "translateY(10px)",
          transition: `opacity 700ms ${EASE.silk} ${step * 150}ms, transform 700ms ${EASE.silk} ${step * 150}ms`,
        };

  return (
    // it starts right where the Save the Date ends
    <section ref={ref} id="couple" aria-label="Welcome" className="couple-scene relative flex flex-col items-center">
      {/* EN / हिं, as on the Save the Date */}
      <LangToggle className="absolute left-4" style={{ top: "calc(var(--status-bar) + 12px)" }} />

      {/* the arch, from the very top (no gap after the Save the Date), with its three bells hung back in place to sway */}
      <div
        aria-hidden
        className="couple-arch pointer-events-none absolute inset-x-0 select-none"
        style={{ aspectRatio: `${coupleArchSize.width} / ${coupleArchSize.height}` }}
      >
        <img
          src={coupleArch}
          alt=""
          width={coupleArchSize.width}
          height={coupleArchSize.height}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="block h-auto w-full"
        />
        {coupleBells.map((bell, i) => (
          <img
            key={bell.src}
            src={bell.src}
            alt=""
            width={bell.size.width}
            height={bell.size.height}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="couple-bell"
            style={{ left: `${bell.left}%`, top: `${bell.top}%`, width: `${bell.width}%`, animationDelay: `${i * -1.3}s` }}
          />
        ))}
      </div>

      {/* ── the welcome, on the sky just below the bells ── */}
      <div className="couple-welcome relative z-[1] flex w-full flex-col items-center px-[var(--gutter)] text-center">
        <p
          lang={hindi ? "hi" : undefined}
          className={`text-[30px] font-semibold leading-none text-gold-ink ${hindi ? "font-deva" : "font-display italic"}`}
          style={appear(0)}
        >
          {hindi ? copy.hindi.welcome : copy.welcome}
        </p>
        <p
          className="mt-[14px] max-w-full font-display text-[17px] font-medium leading-tight text-navy [overflow-wrap:anywhere]"
          style={appear(1)}
        >
          {dearBefore}
          <strong className="text-[20px] font-bold">{guest}</strong>
          {dearAfter}
        </p>
        <p
          lang={hindi ? "hi" : undefined}
          className={`mt-0.5 text-[14px] font-medium leading-snug text-slate ${hindi ? "font-deva" : "font-display italic"}`}
          style={appear(2)}
        >
          {hindi ? copy.hindi.invited : copy.invited}
        </p>

        {/* the couple, one above the other */}
        <h2
          className="mt-[20px] flex w-full flex-col items-center font-display text-[clamp(34px,10vw,44px)] font-semibold italic leading-[1.1] text-navy [overflow-wrap:anywhere]"
          style={appear(3)}
        >
          <span className="block max-w-full">{couple.bride.displayName}</span>
          <span className="block text-[0.55em] font-semibold not-italic leading-[1.1] text-gold-ink">&amp;</span>
          <span className="block max-w-full">{couple.groom.displayName}</span>
        </h2>

        <span aria-hidden className="couple-rule mt-[14px]" style={appear(4)} />

        {/* the hashtag: a tap copies it */}
        <div className="relative mt-[14px]" style={appear(4)}>
          <button
            type="button"
            onClick={copyHashtag}
            title="Tap to copy"
            className="min-h-[32px] px-2 font-display text-[15px] font-bold tracking-[0.08em]"
            style={{ color: HASHTAG }}
          >
            {copy.hashtag}
          </button>
          <span role="status" className="couple-toast" data-shown={copied || undefined}>
            {copied ? copy.copied : ""}
          </span>
        </div>

        {/* the date on one line: day | month | year */}
        {date && (
          <p
            className="mt-[22px] flex items-center justify-center gap-3 font-display font-semibold text-navy"
            style={appear(5)}
          >
            <span className="text-[30px] leading-none">{date.day}</span>
            <span aria-hidden className="h-6 w-px bg-gold-ink" />
            <span className="text-[14px] uppercase tracking-[0.2em]">{date.month}</span>
            <span aria-hidden className="h-6 w-px bg-gold-ink" />
            <span className="text-[14px] tracking-[0.2em]">{date.year}</span>
          </p>
        )}

        <span aria-hidden className="couple-rule mt-[14px]" style={appear(6)} />

        {/* the full location — the pin above, then the venue, then the address; tap for directions */}
        <a
          href={directionsUrl(venue)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-[14px] flex min-h-[44px] max-w-full flex-col items-center px-2 font-display text-navy"
          style={appear(6)}
        >
          <Icon name="pin" className="h-[22px] w-[22px] text-gold-ink" strokeWidth={1.6} />
          <span className="mt-1 inline-flex max-w-full items-center gap-1.5 text-[18px] font-bold leading-snug [overflow-wrap:anywhere]">
            {venue.name}
            <Icon name="external" className="h-3.5 w-3.5 shrink-0 text-gold-ink" />
          </span>
          <span className="text-[15px] font-medium leading-snug text-slate [overflow-wrap:anywhere]">{venue.address}</span>
        </a>
      </div>

      {/* whatever height is left goes here, as sky above the couple */}
      <div aria-hidden className="flex-1" />

      {/* the couple at the Shivling: its clear top may sit beside the words, but their heads always
          keep at least 40px of sky below the last line. It sits 40px up, so the Shivling's base and
          the lotuses clear the panel; the marble floor carries on below it, reflected. */}
      <div className="couple-scene-foot relative w-full">
        <img
          src={coupleScene}
          alt="The couple offering water to the Shivling by the river, a temple behind them"
          width={coupleSceneSize.width}
          height={coupleSceneSize.height}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="pointer-events-none block h-auto w-full select-none"
        />
        <div aria-hidden className="couple-floor" style={{ backgroundImage: `url(${coupleScene})` }} />
      </div>

      {/* ── at the foot, on a dark-navy panel: the way on ── */}
      <div className="couple-foot pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex flex-col items-center">
        <OnwardLink
          to="countdown"
          label={hindi ? invitation.hindi.viewInvitation : invitation.viewInvitation}
          devanagari={hindi}
        />
      </div>
    </section>
  );
}

/** Copies text to the clipboard (with a fallback for older browsers); true if it worked. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
