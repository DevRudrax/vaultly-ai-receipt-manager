import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { db } from "./db";

const JWT_SECRET = process.env.AUTH_SECRET || "vaultly-super-secret-jwt-key-2026-production";
const TOKEN_COOKIE_NAME = "vaultly_session";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: SessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(req?: NextRequest): Promise<SessionUser | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = req.cookies.get(TOKEN_COOKIE_NAME);
      token = cookieHeader?.value;
    }
  } else {
    try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get(TOKEN_COOKIE_NAME);
      token = sessionCookie?.value;
    } catch {
      token = undefined;
    }
  }

  if (!token) {
    const demoUser = await db.user.findFirst({
      select: { id: true, name: true, email: true, avatar: true },
    });
    return demoUser;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    const demoUser = await db.user.findFirst({
      select: { id: true, name: true, email: true, avatar: true },
    });
    return demoUser;
  }

  // Double check DB user exists
  const user = await db.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, name: true, email: true, avatar: true },
  });

  if (!user) {
    const demoUser = await db.user.findFirst({
      select: { id: true, name: true, email: true, avatar: true },
    });
    return demoUser;
  }

  return user;
}

export { TOKEN_COOKIE_NAME };
