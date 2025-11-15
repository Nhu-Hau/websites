// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./request.ts");

function normalizeBase(url?: string) {
  if (!url) return undefined;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const API_BASE =
  normalizeBase(process.env.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:4000";

const nextConfig = {
  reactStrictMode: false,

  images: {
    // Sử dụng remotePatterns thay vì domains (deprecated)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3.ap-southeast-2.amazonaws.com",
        pathname: "/project.toeic/**",
      },
    ],
  },

  async rewrites() {
    // chỉ dùng để proxy API backend của bạn
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
} satisfies NextConfig;

export default withNextIntl(nextConfig);
