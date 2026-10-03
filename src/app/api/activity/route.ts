import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const logs = await db.query.activityLogs.findMany({
      orderBy: [desc(activityLogs.createdAt)],
      limit: 30,
    });

    return NextResponse.json({ ok: true, logs });
  } catch (error) {
    console.error("Activity GET error:", error);
    return NextResponse.json({ ok: false, error: "فشل تحميل سجل الأنشطة / Failed to fetch activities" }, { status: 500 });
  }
}
