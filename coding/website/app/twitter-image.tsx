// Reuse the OpenGraph image for Twitter cards.
// Turbopack requires config exports to be statically parsable, so we declare
// them inline (instead of re-exporting) but still share the default render.
import { siteConfig } from "@/lib/site";
import OGImage from "./opengraph-image";

export const runtime = "edge";
export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default OGImage;
