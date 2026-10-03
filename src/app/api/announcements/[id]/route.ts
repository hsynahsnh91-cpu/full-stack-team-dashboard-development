import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const announcementId = parseInt(id, 10);
    if (isNaN(announcementId)) {
      return NextResponse.json({ ok: false, error: "معرف غير صالح / Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const { title, content, category, pinned } = body;

    const existing = await db.query.announcements.findFirst({
      where: eq(announcements.id, announcementId),
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "الإعلان غير موجود / Announcement not found" }, { status: 404 });
    }

    const updates: Partial<typeof announcements.$inferInsert> = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();
    if (category !== undefined) updates.category = category;
    if (pinned !== undefined) updates.pinned = Boolean(pinned);

    const [updated] = await db
      .update(announcements)
      .set(updates)
      .where(eq(announcements.id, announcementId))
      .returning();

    await logActivity({
      action: "updated",
      resourceType: "announcement",
      resourceTitle: updated.title,
      userName: auth.name,
      userId: auth.userId,
      details: `تم تعديل الإعلان: ${updated.title}`,
    });

    return NextResponse.json({
      ok: true,
      message: "تم تحديث الإعلان بنجاح / Announcement updated successfully",
      announcement: updated,
    });
  } catch (error) {
    console.error("Announcement PUT error:", error);
    return NextResponse.json({ ok: false, error: "فشل تحديث الإعلان / Failed to update announcement" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const announcementId = parseInt(id, 10);
    if (isNaN(announcementId)) {
      return NextResponse.json({ ok: false, error: "معرف غير صالح / Invalid ID" }, { status: 400 });
    }

    const existing = await db.query.announcements.findFirst({
      where: eq(announcements.id, announcementId),
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "الإعلان غير موجود / Announcement not found" }, { status: 404 });
    }

    await db.delete(announcements).where(eq(announcements.id, announcementId));

    await logActivity({
      action: "deleted",
      resourceType: "announcement",
      resourceTitle: existing.title,
      userName: auth.name,
      userId: auth.userId,
      details: `تم حذف الإعلان: ${existing.title}`,
    });

    return NextResponse.json({
      ok: true,
      message: "تم حذف الإعلان بنجاح / Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Announcement DELETE error:", error);
    return NextResponse.json({ ok: false, error: "فشل حذف الإعلان / Failed to delete announcement" }, { status: 500 });
  }
}
