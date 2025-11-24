import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "vi"],
  defaultLocale: "vi", // <--- ngôn ngữ mặc định
  localePrefix: "as-needed", // <--- không hiện /vi
  localeDetection: false,
});

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel).*)",
    "/",
  ],
};
