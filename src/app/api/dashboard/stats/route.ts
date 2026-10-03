import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { projects, tasks, teamMembers, activityLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const allProjects = await db.query.projects.findMany({
      orderBy: [desc(projects.createdAt)],
    });

    const allTasks = await db.query.tasks.findMany({
      orderBy: [desc(tasks.createdAt)],
    });

    const allMembers = await db.query.teamMembers.findMany();

    const recentLogs = await db.query.activityLogs.findMany({
      orderBy: [desc(activityLogs.createdAt)],
      limit: 6,
    });

    const totalProjects = allProjects.length;
    const completedProjects = allProjects.filter((p) => p.status === "completed").length;
    const inProgressProjects = allProjects.filter((p) => p.status === "in_progress").length;
    const planningProjects = allProjects.filter((p) => p.status === "planning").length;

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "completed").length;
    const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length;
    const todoTasks = allTasks.filter((t) => t.status === "todo").length;
    const inReviewTasks = allTasks.filter((t) => t.status === "in_review").length;

    const urgentTasks = allTasks.filter((t) => t.priority === "urgent" && t.status !== "completed").length;

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const projectCompletionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    // Upcoming tasks with due date
    const tasksWithDueDate = allTasks
      .filter((t) => t.dueDate && t.status !== "completed")
      .slice(0, 5);

    return NextResponse.json({
      ok: true,
      stats: {
        totalProjects,
        completedProjects,
        inProgressProjects,
        planningProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        inReviewTasks,
        urgentTasks,
        totalMembers: allMembers.length,
        taskCompletionRate,
        projectCompletionRate,
      },
      upcomingTasks: tasksWithDueDate,
      recentActivity: recentLogs,
      recentProjects: allProjects.slice(0, 4),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ ok: false, error: "فشل تحميل إحصائيات لوحة التحكم / Failed to fetch stats" }, { status: 500 });
  }
}
