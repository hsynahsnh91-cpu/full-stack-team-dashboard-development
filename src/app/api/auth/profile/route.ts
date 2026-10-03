import { NextResponse } from "next/server";
import { authenticateRequest, hashPassword, comparePassword } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export async function PUT(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, jobTitle, phone, bio, avatarColor, currentPassword, newPassword } = body;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
    });

    if (!existingUser) {
      return NextResponse.json({ ok: false, error: "المستخدم غير موجود / User not found" }, { status: 404 });
    }

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name) updates.name = name.trim();
    if (jobTitle !== undefined) updates.jobTitle = jobTitle?.trim() || "";
    if (phone !== undefined) updates.phone = phone?.trim() || "";
    if (bio !== undefined) updates.bio = bio?.trim() || "";
    if (avatarColor) updates.avatarColor = avatarColor;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { ok: false, error: "يرجى إدخال كلمة المرور الحالية لتغييرها / Current password is required" },
          { status: 400 }
        );
      }
      const isMatch = await comparePassword(currentPassword, existingUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { ok: false, error: "كلمة المرور الحالية غير صحيحة / Current password does not match" },
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { ok: false, error: "كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف / Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      updates.passwordHash = await hashPassword(newPassword);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, auth.userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        jobTitle: users.jobTitle,
        phone: users.phone,
        bio: users.bio,
        avatarColor: users.avatarColor,
        createdAt: users.createdAt,
      });

    await logActivity({
      action: "updated",
      resourceType: "profile",
      resourceTitle: updatedUser.name,
      userName: updatedUser.name,
      userId: updatedUser.id,
      details: "تم تحديث الملف الشخصي",
    });

    return NextResponse.json({
      ok: true,
      message: "تم تحديث الملف الشخصي بنجاح / Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ أثناء تحديث الملف الشخصي / Failed to update profile" },
      { status: 500 }
    );
  }
}
