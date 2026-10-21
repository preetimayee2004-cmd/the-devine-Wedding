import { useEffect, useRef, useState, type ReactNode } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { EASE } from "@/lib/motion";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  /** `sheet` rises from the bottom; `lightbox` centres a photo on a dark veil. */
  variant?: "sheet" | "lightbox";
  children: ReactNode;
}

const EXIT_MS = 320;

/**
 * Modal on the native <dialog>: focus moves inside and returns on close,
 * Escape closes, the page behind is inert. Adds enter/exit motion and
 * closes on a tap outside.
 */
export function Sheet({ open, onClose, label, variant = "sheet", children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState(false);
  useScrollLock(open);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    if (!dialog.open) return;
    const timer = window.setTimeout(() => dialog.close(), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  const isSheet = variant === "sheet";
  const panelStyle = {
    transition: `transform ${EXIT_MS + 120}ms ${EASE.silk}, opacity ${EXIT_MS}ms ${EASE.silk}`,
    transform: shown ? "none" : isSheet ? "translateY(100%)" : "scale(0.96)",
    opacity: isSheet || shown ? 1 : 0,
  };

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault(); // animate out instead of closing instantly
        onClose();
      }}
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-slate backdrop:bg-transparent"
    >
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 ${isSheet ? "bg-navy/45" : "bg-navy-deep/90"}`}
        style={{ opacity: shown ? 1 : 0, transition: `opacity ${EXIT_MS}ms ${EASE.silk}` }}
      />

      {isSheet ? (
        <div
          className="absolute inset-x-0 bottom-0 mx-auto max-h-[86dvh] max-w-column overflow-y-auto overscroll-contain rounded-t-[1.75rem] bg-ivory px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-10 shadow-[0_-12px_40px_-12px_rgb(var(--navy)/0.35)]"
          style={panelStyle}
        >
          <span aria-hidden className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-navy/15" />
          <CloseButton onClose={onClose} className="right-3 top-3 text-slate" />
          {children}
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4" style={panelStyle}>
          <div className="pointer-events-auto max-h-full max-w-full">{children}</div>
          <CloseButton
            onClose={onClose}
            className="pointer-events-auto right-3 top-[calc(0.75rem_+_var(--status-bar,0px))] text-ivory"
          />
        </div>
      )}
    </dialog>
  );
}

function CloseButton({ onClose, className }: { onClose: () => void; className: string }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className={`absolute inline-flex h-11 w-11 items-center justify-center rounded-full ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
