import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const pathname = req.nextUrl.pathname;

  if (isAuthenticated && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isAuthenticated && pathname.startsWith("/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|serwist|manifest\\.webmanifest|~offline|\\.well-known|public).*)",
  ],
};
