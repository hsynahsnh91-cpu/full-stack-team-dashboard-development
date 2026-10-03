import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "arena-team-dashboard-secure-jwt-key-2025-super-secret";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = "auth_token";

export interface TokenPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  jobTitle?: string | null;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload?.userId) return null;

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        phone: true,
        bio: true,
        avatarColor: true,
        createdAt: true,
      },
    });

    return user ?? null;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookiesArr = cookieHeader.split(";").map((c) => c.trim());
    for (const c of cookiesArr) {
      if (c.startsWith(`${COOKIE_NAME}=`)) {
        return decodeURIComponent(c.substring(COOKIE_NAME.length + 1));
      }
    }
  }

  return null;
}

export async function authenticateRequest(req: Request) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };
