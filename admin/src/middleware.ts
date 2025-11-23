import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Bảo vệ các route admin -> yêu cầu cookie adminToken
  if (pathname.startsWith("/users") || pathname.startsWith("/admin-chat")) {
    const hasAdminAccess = req.cookies.has("adminToken");
    if (!hasAdminAccess) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/users/:path*", "/admin-chat/:path*"],
};
