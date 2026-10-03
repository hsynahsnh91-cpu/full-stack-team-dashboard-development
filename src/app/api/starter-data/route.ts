import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/db";
import { projects, tasks, teamMembers, announcements, activityLogs } from "@/db/schema";
import { logActivity } from "@/lib/activity";

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    // Optional user-triggered template generation
    const [p1] = await db
      .insert(projects)
      .values({
        title: "تطوير المنصة الرقمية / Digital Platform Launch",
        description: "بناء وتطوير واجهات وتجربة المستخدم مع أنظمة الأمان المتطورة",
        status: "in_progress",
        priority: "high",
        category: "Product",
        progress: 65,
        budget: "$18,500",
        startDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        ownerId: auth.userId,
      })
      .returning();

    const [p2] = await db
      .insert(projects)
      .values({
        title: "حملة التسويق والنمو / Q3 Growth Campaign",
        description: "إطلاق استراتيجية التسويق الرقمي وتوسيع قاعدة العملاء",
        status: "planning",
        priority: "medium",
        category: "Marketing",
        progress: 25,
        budget: "$7,200",
        startDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        ownerId: auth.userId,
      })
      .returning();

    await db.insert(tasks).values([
      {
        projectId: p1.id,
        title: "تصميم واجهات المستخدم والمخططات التفاعلية",
        description: "إعداد ملفات Figma للوحة التحكم وصفحة الملف الشخصي",
        status: "completed",
        priority: "high",
        assignedTo: auth.name,
        assignedEmail: auth.email,
        dueDate: new Date().toISOString().split("T")[0],
        tags: "Design, UI/UX",
        createdBy: auth.userId,
      },
      {
        projectId: p1.id,
        title: "ربط واجهات برمجة التطبيقات وقاعدة البيانات",
        description: "تطبيق عمليات CRUD ومصادقة JWT والتحقق من الصلاحيات",
        status: "in_progress",
        priority: "urgent",
        assignedTo: auth.name,
        assignedEmail: auth.email,
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
        tags: "Backend, API",
        createdBy: auth.userId,
      },
      {
        projectId: p2.id,
        title: "إعداد المحتوى الإعلاني والتصاميم الترويجية",
        description: "كتابة نصوص الحملة وتجهيز المواد التسويقية للشبكات الاجتماعية",
        status: "todo",
        priority: "medium",
        assignedTo: auth.name,
        assignedEmail: auth.email,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        tags: "Marketing, Content",
        createdBy: auth.userId,
      },
    ]);

    await db.insert(announcements).values({
      title: "مرحباً بكم في مساحة عمل الفريق الرسمية!",
      content: "تم إطلاق لوحة تحكم الفريق بكامل المزايا. يمكنكم الآن إدارة المشاريع والمهام والتواصل بفاعلية وسلاسة.",
      category: "milestone",
      pinned: true,
      authorName: auth.name,
      authorId: auth.userId,
    });

    await logActivity({
      action: "created",
      resourceType: "project",
      resourceTitle: "تم توليد قوالب البداية",
      userName: auth.name,
      userId: auth.userId,
      details: "قام المستخدم بتوليد مشاريع ومهام نموذجية لمساحة عمله",
    });

    return NextResponse.json({
      ok: true,
      message: "تمت إضافة نماذج البداية بنجاح / Starter items added successfully",
    });
  } catch (error) {
    console.error("Starter data error:", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ / Failed to generate starter data" }, { status: 500 });
  }
}

// Clean / Reset workspace data to keep everything completely pristine
export async function DELETE(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth?.userId) {
      return NextResponse.json({ ok: false, error: "غير مصرح / Unauthorized" }, { status: 401 });
    }

    await db.delete(tasks);
    await db.delete(projects);
    await db.delete(announcements);
    await db.delete(activityLogs);

    return NextResponse.json({
      ok: true,
      message: "تم تنظيف وتفريغ كافة البيانات بنجاح، مساحة عملك نظيفة تماماً الآن / All data wiped, workspace is completely clean!",
    });
  } catch (error) {
    console.error("Reset data error:", error);
    return NextResponse.json({ ok: false, error: "حدث خطأ / Failed to clean data" }, { status: 500 });
  }
}
