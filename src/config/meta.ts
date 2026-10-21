import { wedding } from "./wedding";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function pageTitle(): string {
  const { bride, groom } = wedding.couple;
  return wedding.meta.title.replace("{bride}", bride.displayName).replace("{groom}", groom.displayName);
}

/**
 * <head> tags for sharing. Rendered into index.html at build time (see
 * vite.config.ts) because WhatsApp and other link previewers don't run JS.
 * The Open Graph image arrives in the final pass (Phase 14).
 */
export function headTags(): string {
  const { description, siteUrl, noindex } = wedding.meta;
  const title = esc(pageTitle());
  const desc = esc(description);
  const base = siteUrl.replace(/\/$/, "");

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    noindex && `<meta name="robots" content="noindex, nofollow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    base && `<meta property="og:url" content="${esc(base)}/" />`,
  ]
    .filter(Boolean)
    .join("\n    ");
}
