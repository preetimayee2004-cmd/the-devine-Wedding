import type { CSSProperties } from "react";
import { setLang, useLang } from "@/lib/lang";

/** EN / हिं — the card in English or Hindi. The caller places it. */
export function LangToggle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const lang = useLang();
  return (
    <div
      role="group"
      aria-label="Language"
      className={`z-[3] flex rounded-full border border-gold/70 bg-ivory/80 p-0.5 shadow-[0_4px_14px_-6px_rgb(var(--navy)/0.3)] backdrop-blur-sm ${className}`}
      style={style}
    >
      {(["en", "hi"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          lang={code === "hi" ? "hi" : "en"}
          className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[14px] font-semibold transition-colors duration-300 ${code === "hi" ? "font-deva" : "font-display"} ${lang === code ? "bg-navy text-ivory" : "text-navy"}`}
        >
          {code === "hi" ? "हिं" : "EN"}
        </button>
      ))}
    </div>
  );
}
