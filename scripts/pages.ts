/**
 * The pages of the site (ADR 0020): the template Vite builds each from, and the path it is served
 * at. vite.config.ts, referenceBuild, prerender and verify-dist.ts all read this list.
 */
export const pages = [{ html: "index.html", path: "/" }] as const;

export const productionOrigin = "https://mojisashi.app";

/** The one URL a page names in canonical and og:url. */
export const pageUrl = (path: string) => `${productionOrigin}${path}`;
