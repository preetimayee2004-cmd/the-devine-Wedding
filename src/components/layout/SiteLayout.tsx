import type { ReactNode } from "react";
import { wedding } from "@/config/wedding";

/** The invitation itself: one continuous sky behind every section, centred column on tablet widths. */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] overflow-x-clip">
      <div aria-hidden className="sky-backdrop" style={{ ["--sky-image" as string]: `url(${wedding.assets.sky})` }} />
      <main className="mx-auto w-full max-w-column">{children}</main>
    </div>
  );
}
