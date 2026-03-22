import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true, // serves local public/ images correctly in Docker
  },
};

export default nextConfig;
