import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { desc } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("q") || "";

    const items = await db.query.announcements.findMany({
      orderBy: [desc(announcements.pinned), desc(announcements.createdAt)],
    });

    let filtered = items;
    if (category && category !== "all") {
      filtered = filtered.filter((a) => a.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ ok: true, announcements: filtered });
  } catch (error) {
    console.error("Announcements GET error:", error);
    return NextResponse.json({ ok: false, error: "فشل تحميل الإعلانات / Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, category, pinned } = body;

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: "العنوان ومحتوى الإعلان مطلوبان / Title and content are required" },
        { status: 400 }
      );
    }

    const [newAnnouncement] = await db
      .insert(announcements)
      .values({
        title: title.trim(),
        content: content.trim(),
        category: category || "general",
        pinned: Boolean(pinned),
        authorName: auth.name,
        authorId: auth.userId,
      })
      .returning();

    await logActivity({
      action: "created",
      resourceType: "announcement",
      resourceTitle: newAnnouncement.title,
      userName: auth.name,
      userId: auth.userId,
      details: `تم نشر إعلان جديد: ${newAnnouncement.title}`,
    });

    return NextResponse.json({
      ok: true,
      message: "تم نشر الإعلان بنجاح / Announcement posted successfully",
      announcement: newAnnouncement,
    });
  } catch (error) {
    console.error("Announcements POST error:", error);
    return NextResponse.json({ ok: false, error: "فشل نشر الإعلان / Failed to post announcement" }, { status: 500 });
  }
}
