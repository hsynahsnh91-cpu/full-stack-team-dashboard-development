import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { desc, ilike, or, eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";

    const allProjects = await db.query.projects.findMany({
      orderBy: [desc(projects.createdAt)],
    });

    // Get all tasks to calculate task counts and completed tasks per project
    const allTasks = await db.query.tasks.findMany();

    let filtered = allProjects.map((p) => {
      const projectTasks = allTasks.filter((t) => t.projectId === p.id);
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter((t) => t.status === "completed").length;
      return {
        ...p,
        totalTasks,
        completedTasks,
      };
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    if (status && status !== "all") {
      filtered = filtered.filter((p) => p.status === status);
    }

    if (priority && priority !== "all") {
      filtered = filtered.filter((p) => p.priority === priority);
    }

    return NextResponse.json({ ok: true, projects: filtered });
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json({ ok: false, error: "فشل تحميل المشاريع / Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, status, priority, category, budget, startDate, dueDate, progress } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ ok: false, error: "عنوان المشروع مطلوب / Project title is required" }, { status: 400 });
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        title: title.trim(),
        description: description?.trim() || "",
        status: status || "planning",
        priority: priority || "medium",
        category: category?.trim() || "General",
        budget: budget?.trim() || "",
        startDate: startDate || "",
        dueDate: dueDate || "",
        progress: Number(progress) || 0,
        ownerId: auth.userId,
      })
      .returning();

    await logActivity({
      action: "created",
      resourceType: "project",
      resourceTitle: newProject.title,
      userName: auth.name,
      userId: auth.userId,
      details: `تم إنشاء مشروع جديد: ${newProject.title}`,
    });

    return NextResponse.json({
      ok: true,
      message: "تم إنشاء المشروع بنجاح / Project created successfully",
      project: {
        ...newProject,
        totalTasks: 0,
        completedTasks: 0,
      },
    });
  } catch (error) {
    console.error("Projects POST error:", error);
    return NextResponse.json({ ok: false, error: "فشل إنشاء المشروع / Failed to create project" }, { status: 500 });
  }
}
