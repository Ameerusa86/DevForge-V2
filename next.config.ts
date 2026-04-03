import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "t3.storage.dev",
      },
      {
        protocol: "https",
        hostname: "learnhub-lms.t3.storage.dev",
      },
    ],
  },
};

export default nextConfig;
