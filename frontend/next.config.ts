import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.152.75.101"],
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
      "../node_modules/@img/sharp-linux-x64/**/*",
      "../node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
  turbopack: {
    root: resolve(process.cwd(), ".."),
  },
};

export default nextConfig;
