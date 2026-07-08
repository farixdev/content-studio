import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { ROLE_HOME, type Role } from "@/lib/constants";

const ROLE_PREFIX: Record<Role, string> = {
  ADMIN: "/admin",
  WRITER: "/writer",
  REVIEWER: "/reviewer",
  DESIGNER: "/designer",
  DEVELOPER: "/developer",
};

const PROTECTED_PREFIXES = ["/admin", "/writer", "/reviewer", "/designer", "/developer", "/chat"];

/** Reviewers co-manage content: they may also use the shared admin pages for
 * projects, content, and member work history — but not the admin dashboard or
 * team management. */
function isAllowed(role: Role, pathname: string): boolean {
  // Team chat is open to every signed-in member.
  if (pathname.startsWith("/chat")) return true;
  const prefix = ROLE_PREFIX[role];
  if (prefix && pathname.startsWith(prefix)) return true;
  if (role === "REVIEWER") {
    return (
      pathname.startsWith("/admin/projects") ||
      pathname.startsWith("/admin/tasks") ||
      /^\/admin\/team\/.+/.test(pathname)
    );
  }
  return false;
}

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
    if (!isAllowed(session.role, pathname)) {
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
  matcher: [
    "/admin/:path*",
    "/writer/:path*",
    "/reviewer/:path*",
    "/designer/:path*",
    "/developer/:path*",
    "/chat/:path*",
    "/login",
  ],
};
