import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const base = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000").replace(/\/+$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${base}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
