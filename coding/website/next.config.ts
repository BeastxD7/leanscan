import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin Turbopack's project root to this directory.
  // Without this, Turbopack walks upward and picks up the LeanScan monorepo
  // root (which has multiple package.json files in coding/api, coding/app,
  // etc.) and gets confused.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
