import type { ReactNode } from "react";

/**
 * The invitation itself: one continuous Himalayan mist warming into ivory behind every section,
 * centred column on tablet widths.
 */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] overflow-x-clip">
      <div aria-hidden className="sky-backdrop" />
      <main className="mx-auto w-full max-w-column">{children}</main>
    </div>
  );
}
