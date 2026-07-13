import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/pipeline",
        destination: `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`,
      },
    ];
  },
};

export default nextConfig;
