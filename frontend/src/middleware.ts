import createMiddleware from "next-intl/middleware";
import { routing } from "./routing";

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false,
});

export default function middleware(req: any) {
  const { pathname } = req.nextUrl;
  // Log request for debugging
  console.log(`[Frontend] ${req.method} ${pathname}`);

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next/static|_next/image|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp)|images/).*)",
  ],
};


