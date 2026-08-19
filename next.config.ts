import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "postgres",
    "playwright",
    "playwright-core",
  ],
};

export default nextConfig;
