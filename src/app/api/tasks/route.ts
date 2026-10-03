import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { tasks, projects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("q") || "";

    const allTasks = await db.query.tasks.findMany({
      orderBy: [desc(tasks.createdAt)],
    });

    const allProjects = await db.query.projects.findMany({
      columns: { id: true, title: true },
    });

    const projectMap = new Map<number, string>();
    allProjects.forEach((p) => projectMap.set(p.id, p.title));

    let filtered = allTasks.map((t) => ({
      ...t,
      projectTitle: t.projectId ? projectMap.get(t.projectId) || "No Project" : "No Project",
    }));

    if (projectId && projectId !== "all") {
      const pid = parseInt(projectId, 10);
      filtered = filtered.filter((t) => t.projectId === pid);
    }

    if (status && status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }

    if (priority && priority !== "all") {
      filtered = filtered.filter((t) => t.priority === priority);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.assignedTo && t.assignedTo.toLowerCase().includes(q)) ||
          (t.tags && t.tags.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ ok: true, tasks: filtered });
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json({ ok: false, error: "فشل تحميل المهام / Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, projectId, status, priority, assignedTo, assignedEmail, dueDate, tags } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ ok: false, error: "عنوان المهمة مطلوب / Task title is required" }, { status: 400 });
    }

    const [newTask] = await db
      .insert(tasks)
      .values({
        title: title.trim(),
        description: description?.trim() || "",
        projectId: projectId ? parseInt(projectId, 10) : null,
        status: status || "todo",
        priority: priority || "medium",
        assignedTo: assignedTo?.trim() || "",
        assignedEmail: assignedEmail?.trim() || "",
        dueDate: dueDate || "",
        tags: tags?.trim() || "",
        createdBy: auth.userId,
      })
      .returning();

    // Fetch project title if linked
    let projectTitle = "No Project";
    if (newTask.projectId) {
      const p = await db.query.projects.findFirst({
        where: eq(projects.id, newTask.projectId),
        columns: { title: true },
      });
      if (p) projectTitle = p.title;
    }

    await logActivity({
      action: "created",
      resourceType: "task",
      resourceTitle: newTask.title,
      userName: auth.name,
      userId: auth.userId,
      details: `تمت إضافة مهمة جديدة: ${newTask.title}`,
    });

    return NextResponse.json({
      ok: true,
      message: "تم إنشاء المهمة بنجاح / Task created successfully",
      task: {
        ...newTask,
        projectTitle,
      },
    });
  } catch (error) {
    console.error("Tasks POST error:", error);
    return NextResponse.json({ ok: false, error: "فشل إنشاء المهمة / Failed to create task" }, { status: 500 });
  }
}
