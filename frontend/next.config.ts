import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./request.ts");

const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "images.pexels.com"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*", // BE dev
      },
    ];
  },
  reactStrictMode: false,
};

export default withNextIntl(nextConfig);
