import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { comparePassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "يرجى إدخال البريد الإلكتروني وكلمة المرور / Email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await db.query.users.findFirst({
      where: eq(users.email, trimmedEmail),
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "بيانات الاعتماد غير صحيحة / Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { ok: false, error: "بيانات الاعتماد غير صحيحة / Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      jobTitle: user.jobTitle,
    });

    await logActivity({
      action: "logged_in",
      resourceType: "auth",
      resourceTitle: user.name,
      userName: user.name,
      userId: user.id,
      details: "تسجيل دخول ناجح للمستخدم",
    });

    const response = NextResponse.json({
      ok: true,
      message: "تم تسجيل الدخول بنجاح / Logged in successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        jobTitle: user.jobTitle,
        avatarColor: user.avatarColor,
        phone: user.phone,
        bio: user.bio,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ أثناء تسجيل الدخول / Failed to login" },
      { status: 500 }
    );
  }
}
