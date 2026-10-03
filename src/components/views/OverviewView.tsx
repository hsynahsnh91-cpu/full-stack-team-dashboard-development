"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  FolderKanban,
  CheckSquare,
  Users,
  TrendingUp,
  Clock,
  Plus,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

import { NavTab } from "../Sidebar";

interface OverviewProps {
  onNavigate: (tab: NavTab) => void;
  onQuickAction: (action: "project" | "task" | "member" | "announcement") => void;
}

interface StatsData {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  planningProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  inReviewTasks: number;
  urgentTasks: number;
  totalMembers: number;
  taskCompletionRate: number;
  projectCompletionRate: number;
}

interface UpcomingTask {
  id: number;
  title: string;
  dueDate: string | null;
  priority: string;
  status: string;
  assignedTo: string | null;
}

interface RecentActivity {
  id: number;
  action: string;
  resourceType: string;
  resourceTitle: string | null;
  userName: string;
  details: string | null;
  createdAt: string;
}

export function OverviewView({ onNavigate, onQuickAction }: OverviewProps) {
  const { t, lang, user, team } = useApp();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingTask[]>([]);
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setStats(data.stats);
          setUpcoming(data.upcomingTasks || []);
          setRecent(data.recentActivity || []);
        }
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isWorkspaceEmpty =
    !loading &&
    stats &&
    stats.totalProjects === 0 &&
    stats.totalTasks === 0 &&
    stats.totalMembers <= 1;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-slate-900/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-400 text-xs font-semibold mb-3 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {t.cleanNoticeTitle}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {lang === "ar" ? `مرحباً بك، ${user?.name || ""}` : `Welcome back, ${user?.name || ""}`}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            {team?.name ? `${team.name} • ` : ""}
            {t.appSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onQuickAction("project")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.newProject}</span>
            </button>
            <button
              onClick={() => onQuickAction("task")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition border border-white/15 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{t.newTask}</span>
            </button>
            <button
              onClick={() => onQuickAction("member")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition border border-white/15 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{t.newMember}</span>
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-72 h-72 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
      </div>

      {/* Fresh Clean Workspace Welcome Guide */}
      {isWorkspaceEmpty && (
        <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-emerald-950">
                {lang === "ar" ? "مساحة عملك جاهزة ونظيفة تماماً!" : "Your workspace is pristine and ready!"}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-relaxed">
                {lang === "ar"
                  ? "تم إعداد مساحة العمل خصيصاً لك بدون أي حسابات وهمية أو بيانات افتراضية مسبقة. يمكنك البدء الآن بإنشاء أول مشروع لفريقك، وإسناد المهام، ودعوة زملائك للمشاركة."
                  : "Your workspace has been created completely clean with zero mock accounts or dummy default data. Start by creating your first real project, adding tasks, and inviting team members."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => onQuickAction("project")}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.createFirstProject}</span>
                </button>
                <button
                  onClick={() => onQuickAction("task")}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold transition cursor-pointer"
                >
                  <span>{t.createFirstTask}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div
          onClick={() => onNavigate("projects")}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.statsTotalProjects}
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? "..." : stats?.totalProjects ?? 0}
            </span>
            <span className="text-xs text-slate-500">
              ({stats?.inProgressProjects ?? 0} {t.statusInProgress})
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600">
            <span>{t.projectsTitle}</span>
            {lang === "ar" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Active Tasks */}
        <div
          onClick={() => onNavigate("tasks")}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.statsActiveTasks}
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading
                ? "..."
                : (stats?.todoTasks ?? 0) + (stats?.inProgressTasks ?? 0) + (stats?.inReviewTasks ?? 0)}
            </span>
            {stats?.urgentTasks ? (
              <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                {stats.urgentTasks} {t.priorityUrgent}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600">
            <span>{t.tasksTitle}</span>
            {lang === "ar" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Completed Tasks */}
        <div
          onClick={() => onNavigate("tasks")}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.statsCompletedTasks}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? "..." : stats?.completedTasks ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              {stats?.taskCompletionRate ?? 0}% {lang === "ar" ? "معدل الإنجاز" : "rate"}
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats?.taskCompletionRate ?? 0}%` }}
            />
          </div>
        </div>

        {/* Team Members */}
        <div
          onClick={() => onNavigate("members")}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-violet-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.statsTeamMembers}
            </span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? "..." : stats?.totalMembers ?? 0}
            </span>
            <span className="text-xs text-slate-500">
              {lang === "ar" ? "عضو مسجل" : "active"}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-violet-600">
            <span>{t.membersTitle}</span>
            {lang === "ar" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Two Column Section: Upcoming Deadlines & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">{t.upcomingDeadlines}</h3>
            </div>
            <button
              onClick={() => onNavigate("tasks")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {lang === "ar" ? "عرض الكل" : "View all"}
            </button>
          </div>

          {upcoming.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">
                {lang === "ar"
                  ? "لا توجد مواعيد تسليم مجدولة حالياً."
                  : "No upcoming deadlines scheduled."}
              </p>
              <button
                onClick={() => onQuickAction("task")}
                className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer"
              >
                + {t.newTask}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition"
                >
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      {task.dueDate && <span>{task.dueDate}</span>}
                      {task.assignedTo && <span>• {task.assignedTo}</span>}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
                      task.priority === "urgent"
                        ? "bg-rose-100 text-rose-700"
                        : task.priority === "high"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">{t.recentActivity}</h3>
            </div>
            <button
              onClick={() => onNavigate("activity")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {lang === "ar" ? "عرض السجل" : "View audit"}
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">
                {lang === "ar"
                  ? "لا توجد أنشطة مسجلة بعد. ستظهر هنا كافة إجراءات الفريق."
                  : "No activity recorded yet. Actions will appear here as they occur."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {log.details || log.resourceTitle || log.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
