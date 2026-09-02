import { auth } from "@/auth";
import { isAllowedEmail } from "@/core/config/allowed-emails";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const isPublicPage =
    pathname.startsWith("/login") || pathname.startsWith("/auth/error");

  if (
    isAuthenticated &&
    !isAllowedEmail(req.auth?.user?.email) &&
    !pathname.startsWith("/auth/error")
  ) {
    return NextResponse.redirect(
      new URL("/auth/error?error=AccessDenied", req.url),
    );
  }

  if (!isAuthenticated && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthenticated && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
