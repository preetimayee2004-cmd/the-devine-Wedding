import { wedding } from "./wedding";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function pageTitle(): string {
  const { bride, groom } = wedding.couple;
  return wedding.meta.title.replace("{bride}", bride.displayName).replace("{groom}", groom.displayName);
}

/**
 * <head> tags for sharing. Rendered into index.html at build time (see
 * vite.config.ts) because WhatsApp and other link previewers don't run JS.
 * The preview image is made by `npm run og`; previewers need its full
 * address, so set meta.siteUrl once the site is deployed.
 */
export function headTags(): string {
  const { description, siteUrl, noindex } = wedding.meta;
  const title = esc(pageTitle());
  const desc = esc(description);
  const base = siteUrl.replace(/\/$/, "");
  const image = esc(`${base}/og-image.jpg`);

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    noindex && `<meta name="robots" content="noindex, nofollow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    base && `<meta property="og:url" content="${esc(base)}/" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ]
    .filter(Boolean)
    .join("\n    ");
}
