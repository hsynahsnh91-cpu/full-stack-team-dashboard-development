import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { teamMembers } from "@/db/schema";
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
    const memberId = parseInt(id, 10);
    if (isNaN(memberId)) {
      return NextResponse.json({ ok: false, error: "معرف غير صالح / Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, email, role, department, phone, status } = body;

    const existing = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, memberId),
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "العضو غير موجود / Member not found" }, { status: 404 });
    }

    const updates: Partial<typeof teamMembers.$inferInsert> = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (role !== undefined) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (phone !== undefined) updates.phone = phone?.trim() || "";
    if (status !== undefined) updates.status = status;

    const [updated] = await db
      .update(teamMembers)
      .set(updates)
      .where(eq(teamMembers.id, memberId))
      .returning();

    await logActivity({
      action: "updated",
      resourceType: "member",
      resourceTitle: updated.name,
      userName: auth.name,
      userId: auth.userId,
      details: `تم تحديث بيانات العضو: ${updated.name}`,
    });

    return NextResponse.json({
      ok: true,
      message: "تم تحديث بيانات العضو بنجاح / Member updated successfully",
      member: updated,
    });
  } catch (error) {
    console.error("Member PUT error:", error);
    return NextResponse.json({ ok: false, error: "فشل تحديث بيانات العضو / Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const memberId = parseInt(id, 10);
    if (isNaN(memberId)) {
      return NextResponse.json({ ok: false, error: "معرف غير صالح / Invalid ID" }, { status: 400 });
    }

    const existing = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, memberId),
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "العضو غير موجود / Member not found" }, { status: 404 });
    }

    await db.delete(teamMembers).where(eq(teamMembers.id, memberId));

    await logActivity({
      action: "deleted",
      resourceType: "member",
      resourceTitle: existing.name,
      userName: auth.name,
      userId: auth.userId,
      details: `تم حذف العضو: ${existing.name}`,
    });

    return NextResponse.json({
      ok: true,
      message: "تم حذف العضو بنجاح / Member removed successfully",
    });
  } catch (error) {
    console.error("Member DELETE error:", error);
    return NextResponse.json({ ok: false, error: "فشل حذف العضو / Failed to delete member" }, { status: 500 });
  }
}
