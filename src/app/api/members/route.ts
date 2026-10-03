import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { teamMembers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

const AVATAR_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#0891b2",
  "#4f46e5",
];

export async function GET(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";

    const members = await db.query.teamMembers.findMany({
      orderBy: [desc(teamMembers.createdAt)],
    });

    let filtered = members;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.department && m.department.toLowerCase().includes(q)) ||
          (m.role && m.role.toLowerCase().includes(q))
      );
    }

    if (department && department !== "all") {
      filtered = filtered.filter((m) => m.department === department);
    }

    if (status && status !== "all") {
      filtered = filtered.filter((m) => m.status === status);
    }

    return NextResponse.json({ ok: true, members: filtered });
  } catch (error) {
    console.error("Members GET error:", error);
    return NextResponse.json({ ok: false, error: "فشل تحميل أعضاء الفريق / Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, role, department, phone, status } = body;

    if (!name || !email) {
      return NextResponse.json({ ok: false, error: "الاسم والبريد الإلكتروني مطلوبان / Name and email are required" }, { status: 400 });
    }

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const [newMember] = await db
      .insert(teamMembers)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role || "member",
        department: department || "Engineering",
        phone: phone?.trim() || "",
        status: status || "active",
        avatarColor: randomColor,
      })
      .returning();

    await logActivity({
      action: "created",
      resourceType: "member",
      resourceTitle: newMember.name,
      userName: auth.name,
      userId: auth.userId,
      details: `تمت إضافة عضو جديد: ${newMember.name} (${newMember.role})`,
    });

    return NextResponse.json({
      ok: true,
      message: "تمت إضافة عضو الفريق بنجاح / Member added successfully",
      member: newMember,
    });
  } catch (error) {
    console.error("Members POST error:", error);
    return NextResponse.json({ ok: false, error: "فشل إضافة عضو الفريق / Failed to add member" }, { status: 500 });
  }
}
