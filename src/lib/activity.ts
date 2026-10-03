import { db } from "@/db";
import { activityLogs } from "@/db/schema";

interface LogActivityParams {
  action: "created" | "updated" | "deleted" | "status_changed" | "logged_in";
  resourceType: "project" | "task" | "member" | "announcement" | "auth" | "profile";
  resourceTitle?: string;
  userName: string;
  userId?: number;
  details?: string;
  teamId?: number;
}

export async function logActivity(params: LogActivityParams) {
  try {
    await db.insert(activityLogs).values({
      action: params.action,
      resourceType: params.resourceType,
      resourceTitle: params.resourceTitle || null,
      userName: params.userName,
      userId: params.userId || null,
      details: params.details || null,
      teamId: params.teamId || null,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
