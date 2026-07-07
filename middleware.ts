import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { ROLE_HOME, type Role } from "@/lib/constants";

const ROLE_PREFIX: Record<Role, string> = {
  ADMIN: "/admin",
  WRITER: "/writer",
  REVIEWER: "/reviewer",
  DESIGNER: "/designer",
};

const PROTECTED_PREFIXES = ["/admin", "/writer", "/reviewer", "/designer"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    const allowedPrefix = ROLE_PREFIX[session.role];
    if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
      const url = req.nextUrl.clone();
      url.pathname = ROLE_HOME[session.role];
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/login" && session) {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[session.role];
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/writer/:path*", "/reviewer/:path*", "/designer/:path*", "/login"],
};
