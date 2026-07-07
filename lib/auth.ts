// Edge-safe session helpers (JWT via jose). No Node-only imports here so this
// module can be used from middleware.
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./constants";

export const SESSION_COOKIE = "mcs_session";
const ALG = "HS256";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "mindcob-dev-secret";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string; // user id
  role: Role;
  name: string;
  username: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name, username: payload.username })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      role: payload.role as Role,
      name: (payload.name as string) ?? "",
      username: (payload.username as string) ?? "",
    };
  } catch {
    return null;
  }
}
