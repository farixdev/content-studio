import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signSession, SESSION_COOKIE } from "@/lib/auth";
import { ROLE_HOME, type Role } from "@/lib/constants";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const username = parsed.data.username.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const token = await signSession({
    sub: user.id,
    role: user.role as Role,
    name: user.name,
    username: user.username,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true, redirect: ROLE_HOME[user.role as Role] });
}
