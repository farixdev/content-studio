import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./auth";
import { ROLE_HOME, type Role } from "./constants";

export type SessionUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
  active: boolean;
};

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const payload = await getSessionPayload();
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role as Role,
    active: user.active,
  };
}

/** For server components: redirect to /login when not authenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For server components: enforce a role, else redirect to the user's home. */
export async function requireRole(roles: Role | Role[]): Promise<SessionUser> {
  const user = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) redirect(ROLE_HOME[user.role]);
  return user;
}
