import { useGuest } from "@/context/GuestContext";
import { Emblem } from "@/components/ui/Emblem";

/**
 * Stand-in for Section 01 until Phase 3 builds the real invitation. It already
 * wears the gold emblem in its final place, so the opening's hand-off can be
 * reviewed, and greets the guest from the share link.
 */
export function InvitationPlaceholder({ visible, onReplay }: { visible: boolean; onReplay: () => void }) {
  const { guestName } = useGuest();

  return (
    <section
      aria-label="Invitation"
      className={`flex min-h-[100dvh] flex-col items-center px-[var(--gutter)] text-center transition-opacity duration-700 ease-silk ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ paddingTop: "calc(var(--status-bar) + 28px)" }}
    >
      <div data-emblem-target>
        <Emblem />
      </div>

      <p className="mt-10 font-display text-[28px] font-semibold italic text-navy">Dear {guestName},</p>
      <p className="mt-3 max-w-[18rem] text-[15px] text-slate">
        The invitation itself opens here in the next phase.
      </p>

      <button
        type="button"
        onClick={onReplay}
        className="mt-8 rounded-full border border-gold px-5 py-2 font-sans text-[13px] font-medium tracking-[0.12em] text-navy transition-colors hover:bg-ivory/60"
      >
        Replay the opening
      </button>
    </section>
  );
}
