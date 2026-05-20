// Central site metadata. Anything user-visible lives here so we have one
// source of truth for the layout, sitemap, robots, manifest, OG image, etc.

const RAW_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://leanscan.app";

export const siteConfig = {
  name: "LeanScan",
  shortName: "LeanScan",
  url: RAW_URL.replace(/\/$/, ""),
  title: "LeanScan — Protein-first tracking, for everyone",
  shortTitle: "LeanScan",
  description:
    "Snap your meal. Track your day. An AI-powered, protein-first health tracker. Meals, weight, training, and how you feel — in one tap.",
  tagline: "Snap your meal. Track your day.",
  keywords: [
    "protein tracker",
    "calorie tracker",
    "AI food tracker",
    "macro tracker",
    "weight loss app",
    "fitness tracker",
    "photo food log",
    "AI calorie counter",
    "high protein",
    "macro tracking",
    "protein-first",
    "health tracker",
  ],
  authors: [{ name: "Shashank Devadiga" }],
  creator: "Shashank Devadiga",
  publisher: "LeanScan",
  email: "hello@leanscan.app",
  twitter: "@leanscan_app",
  themeColor: "#1a3a2e",
  backgroundColor: "#f5f1ea",
  locale: "en_US",
} as const;

export type SiteConfig = typeof siteConfig;
