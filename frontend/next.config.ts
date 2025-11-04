// next.config.ts
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./request.ts");

function normalizeBase(url?: string) {
  if (!url) return undefined;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const API_BASE = normalizeBase(process.env.NEXT_PUBLIC_API_BASE_URL) || "http://localhost:4000";

const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "images.pexels.com"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
  reactStrictMode: false,
};

export default withNextIntl(nextConfig);
