import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lostlink-super-secure-production-jwt-secret-key-2026"
);

const COOKIE_NAME = "lostlink_token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  let session: any = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload;
    } catch {
      session = null;
    }
  }

  // 1. Admin route protection
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "ADMIN") {
      // Forbidden for regular users
      const forbiddenUrl = new URL("/dashboard?error=admin_required", req.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // 2. Protected user routes
  const protectedPrefixes = [
    "/dashboard",
    "/report",
    "/claim",
    "/my-reports",
    "/notifications",
  ];

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  if (isProtected) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Auth routes redirect if already logged in
  if ((pathname === "/login" || pathname === "/register") && session) {
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/report/:path*",
    "/claim/:path*",
    "/my-reports/:path*",
    "/notifications/:path*",
    "/login",
    "/register",
  ],
};
