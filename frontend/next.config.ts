// frontend/next.config.ts
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./request.ts");

const nextConfig = {};

export default withNextIntl(nextConfig);
