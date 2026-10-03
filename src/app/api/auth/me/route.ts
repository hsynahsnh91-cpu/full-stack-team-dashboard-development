import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { users, teams } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
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

    if (!user) {
      return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }

    const team = await db.query.teams.findFirst({
      where: eq(teams.ownerId, user.id),
    });

    return NextResponse.json({
      ok: true,
      user,
      team: team || { id: 1, name: `${user.name}'s Team` },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ ok: false, user: null }, { status: 500 });
  }
}
