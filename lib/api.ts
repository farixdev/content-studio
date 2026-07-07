import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "./session";
import type { Role } from "./constants";

export function ok(data: unknown = { ok: true }, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
export function forbidden() {
  return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
}
export function notFound(error = "Not found") {
  return NextResponse.json({ error }, { status: 404 });
}
export function serverError(error = "Something went wrong.") {
  return NextResponse.json({ error }, { status: 500 });
}

/**
 * Returns the current user for a route handler, or null. When `roles` is given,
 * also returns null if the user's role is not allowed.
 */
export async function apiUser(roles?: Role | Role[]): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(user.role)) return null;
  }
  return user;
}
