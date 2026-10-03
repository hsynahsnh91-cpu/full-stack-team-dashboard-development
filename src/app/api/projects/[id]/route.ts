import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ ok: false, error: "معرف غير صالح / Invalid ID" }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ ok: false, error: "المشروع غير موجود / Project not found" }, { status: 404 });
    }

    const projectTasks = await db.query.tasks.findMany({
      where: eq(tasks.projectId, projectId),
      orderBy: [desc(tasks.createdAt)],
    });

    return NextResponse.json({
      ok: true,
      project: {
        ...project,
        totalTasks: projectTasks.length,
        completedTasks: projectTasks.filter((t) => t.status === "completed").length,
        tasks: projectTasks,
      },
    });
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ / An error occurred" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ ok: false, error: "معرف غير صالح / Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, status, priority, category, budget, startDate, dueDate, progress } = body;

    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "المشروع غير موجود / Project not found" }, { status: 404 });
    }

    const updates: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || "";
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category?.trim() || "General";
    if (budget !== undefined) updates.budget = budget?.trim() || "";
    if (startDate !== undefined) updates.startDate = startDate;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (progress !== undefined) updates.progress = Math.min(100, Math.max(0, Number(progress) || 0));

    const [updated] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, projectId))
      .returning();

    await logActivity({
      action: "updated",
      resourceType: "project",
      resourceTitle: updated.title,
      userName: auth.name,
      userId: auth.userId,
      details: `تم تحديث المشروع: ${updated.title}`,
    });

    return NextResponse.json({
      ok: true,
      message: "تم تحديث المشروع بنجاح / Project updated successfully",
      project: updated,
    });
  } catch (error) {
    console.error("Project PUT error:", error);
    return NextResponse.json({ ok: false, error: "فشل تحديث المشروع / Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ ok: false, error: "معرف غير صالح / Invalid ID" }, { status: 400 });
    }

    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "المشروع غير موجود / Project not found" }, { status: 404 });
    }

    await db.delete(projects).where(eq(projects.id, projectId));

    await logActivity({
      action: "deleted",
      resourceType: "project",
      resourceTitle: existing.title,
      userName: auth.name,
      userId: auth.userId,
      details: `تم حذف المشروع: ${existing.title}`,
    });

    return NextResponse.json({
      ok: true,
      message: "تم حذف المشروع بنجاح / Project deleted successfully",
    });
  } catch (error) {
    console.error("Project DELETE error:", error);
    return NextResponse.json({ ok: false, error: "فشل حذف المشروع / Failed to delete project" }, { status: 500 });
  }
}
