import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { tasks, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ ok: false, error: "معرف غير صالح / Invalid ID" }, { status: 400 });
    }

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) {
      return NextResponse.json({ ok: false, error: "المهمة غير موجودة / Task not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, task });
  } catch (error) {
    console.error("Task GET error:", error);
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
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ ok: false, error: "معرف غير صالح / Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, projectId, status, priority, assignedTo, assignedEmail, dueDate, tags } = body;

    const existing = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "المهمة غير موجودة / Task not found" }, { status: 404 });
    }

    const updates: Partial<typeof tasks.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || "";
    if (projectId !== undefined) updates.projectId = projectId ? parseInt(projectId, 10) : null;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo?.trim() || "";
    if (assignedEmail !== undefined) updates.assignedEmail = assignedEmail?.trim() || "";
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (tags !== undefined) updates.tags = tags?.trim() || "";

    const [updated] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, taskId))
      .returning();

    let projectTitle = "No Project";
    if (updated.projectId) {
      const p = await db.query.projects.findFirst({
        where: eq(projects.id, updated.projectId),
        columns: { title: true },
      });
      if (p) projectTitle = p.title;
    }

    const statusChanged = status !== undefined && status !== existing.status;
    await logActivity({
      action: statusChanged ? "status_changed" : "updated",
      resourceType: "task",
      resourceTitle: updated.title,
      userName: auth.name,
      userId: auth.userId,
      details: statusChanged
        ? `تم تغيير حالة المهمة إلى "${status}"`
        : `تم تحديث تفاصيل المهمة: ${updated.title}`,
    });

    return NextResponse.json({
      ok: true,
      message: "تم تحديث المهمة بنجاح / Task updated successfully",
      task: {
        ...updated,
        projectTitle,
      },
    });
  } catch (error) {
    console.error("Task PUT error:", error);
    return NextResponse.json({ ok: false, error: "فشل تحديث المهمة / Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ ok: false, error: "معرف غير صالح / Invalid ID" }, { status: 400 });
    }

    const existing = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "المهمة غير موجودة / Task not found" }, { status: 404 });
    }

    await db.delete(tasks).where(eq(tasks.id, taskId));

    await logActivity({
      action: "deleted",
      resourceType: "task",
      resourceTitle: existing.title,
      userName: auth.name,
      userId: auth.userId,
      details: `تم حذف المهمة: ${existing.title}`,
    });

    return NextResponse.json({
      ok: true,
      message: "تم حذف المهمة بنجاح / Task deleted successfully",
    });
  } catch (error) {
    console.error("Task DELETE error:", error);
    return NextResponse.json({ ok: false, error: "فشل حذف المهمة / Failed to delete task" }, { status: 500 });
  }
}
