// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./request.ts");

function normalizeBase(url?: string) {
  if (!url) return undefined;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const API_BASE =
  normalizeBase(process.env.NEXT_PUBLIC_API_BASE_URL) || "http://localhost:4000";

const nextConfig = {
  reactStrictMode: false,

  images: {
    // vẫn giữ các domain cũ
    domains: ["images.unsplash.com", "images.pexels.com"],
    // thêm quyền cho ảnh S3 của bạn
    remotePatterns: [
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
