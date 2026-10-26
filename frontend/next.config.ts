import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.152.75.101"],
  turbopack: {
    root: resolve(process.cwd(), ".."),
  },
};

export default nextConfig;
