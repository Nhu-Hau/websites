import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Protect /users -> require access token cookie
  if (pathname.startsWith("/users")) {
    const hasAccess = req.cookies.has("access_token") || req.cookies.has("accessToken") || req.cookies.has("access");
    if (!hasAccess) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/users/:path*"],
};


