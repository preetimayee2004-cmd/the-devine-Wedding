import { useEffect, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DESKTOP_MOCKUP_QUERY, framedUrl, isFramed } from "@/lib/viewMode";
import { PhoneMockup } from "./PhoneMockup";
import { SiteLayout } from "./SiteLayout";

/**
 * Top-level switch between the real site and the desktop phone mockup.
 * In mockup mode the site itself is NOT rendered here — only inside the
 * iframe — so desktop does no duplicate work.
 */
export function Shell({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery(DESKTOP_MOCKUP_QUERY);

  useEffect(() => {
    if (isFramed) document.documentElement.classList.add("is-framed");
  }, []);

  if (!isFramed && isDesktop) return <PhoneMockup src={framedUrl()} />;

  return <SiteLayout>{children}</SiteLayout>;
}
