import createMiddleware from "next-intl/middleware";
import { routing } from "./routing";

const middleware = createMiddleware({
  ...routing,
  localeDetection: false,
});

export default middleware;

export const config = {
  matcher: [
    "/((?!api|trpc|_next/static|_next/image|_vercel|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
