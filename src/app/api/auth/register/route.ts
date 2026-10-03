import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, teams, teamMembers } from "@/db/schema";
import { hashPassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eq } from "drizzle-orm";

const AVATAR_COLORS = [
  "#2563eb", // blue
  "#7c3aed", // violet
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // red
  "#db2777", // pink
  "#0891b2", // cyan
  "#4f46e5", // indigo
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, jobTitle, teamName } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة / Name, email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "يرجى إدخال بريد إلكتروني صالح / Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل / Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, trimmedEmail),
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "هذا البريد الإلكتروني مسجل بالفعل / This email is already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        role: "admin",
        jobTitle: jobTitle?.trim() || "Team Leader",
        avatarColor: randomColor,
      })
      .returning();

    // Create default workspace / team for the user
    const [newTeam] = await db
      .insert(teams)
      .values({
        name: teamName?.trim() || `${newUser.name}'s Team`,
        description: "مساحة العمل الرئيسية للفريق / Primary team workspace",
        ownerId: newUser.id,
      })
      .returning();

    // Add user as admin member
    await db.insert(teamMembers).values({
      teamId: newTeam.id,
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: "admin",
      department: "Management",
      status: "active",
      avatarColor: randomColor,
    });

    const token = await signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      jobTitle: newUser.jobTitle,
    });

    await logActivity({
      action: "created",
      resourceType: "auth",
      resourceTitle: `حساب جديد: ${newUser.name}`,
      userName: newUser.name,
      userId: newUser.id,
      details: "تم تسجيل حساب جديد بنجاح",
      teamId: newTeam.id,
    });

    const response = NextResponse.json({
      ok: true,
      message: "تم إنشاء الحساب بنجاح / Account created successfully",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        jobTitle: newUser.jobTitle,
        avatarColor: newUser.avatarColor,
      },
      team: newTeam,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ أثناء إنشاء الحساب / Failed to create account" },
      { status: 500 }
    );
  }
}
