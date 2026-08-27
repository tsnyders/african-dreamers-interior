import path from "node:path";
import type { NextConfig } from "next";

const stylesDir = path.join(process.cwd(), "styles");

const nextConfig: NextConfig = {
  sassOptions: {
    // Lets every module write `@use "variables" as vars;` instead of counting
    // ../ hops back to styles/. `loadPaths` is the modern Sass API key;
    // `includePaths` is kept for the legacy API path.
    loadPaths: [stylesDir],
    includePaths: [stylesDir],
  },
};

export default nextConfig;
