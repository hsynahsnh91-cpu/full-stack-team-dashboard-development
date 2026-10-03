"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  History,
  FolderKanban,
  CheckSquare,
  Users,
  Megaphone,
  User,
  RefreshCw,
  Clock,
} from "lucide-react";

interface ActivityItem {
  id: number;
  action: string;
  resourceType: string;
  resourceTitle: string | null;
  userName: string;
  userId: number | null;
  details: string | null;
  createdAt: string;
}

export function ActivityView() {
  const { t, lang } = useApp();
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/activity");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setLogs(data.logs || []);
        }
      }
    } catch (err) {
      console.error("Fetch activity error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "project":
        return <FolderKanban className="w-4 h-4 text-indigo-600" />;
      case "task":
        return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case "member":
        return <Users className="w-4 h-4 text-emerald-600" />;
      case "announcement":
        return <Megaphone className="w-4 h-4 text-amber-600" />;
      default:
        return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "created":
        return { label: lang === "ar" ? "إنشاء" : "Created", bg: "bg-emerald-50 text-emerald-700" };
      case "updated":
        return { label: lang === "ar" ? "تحديث" : "Updated", bg: "bg-blue-50 text-blue-700" };
      case "deleted":
        return { label: lang === "ar" ? "حذف" : "Deleted", bg: "bg-rose-50 text-rose-700" };
      case "status_changed":
        return { label: lang === "ar" ? "تغيير حالة" : "Status", bg: "bg-purple-50 text-purple-700" };
      default:
        return { label: lang === "ar" ? "نشاط" : "Action", bg: "bg-slate-100 text-slate-700" };
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(lang === "ar" ? "ar-SA" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.activityTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.activityDesc}</p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{lang === "ar" ? "تحديث السجل" : "Refresh"}</span>
        </button>
      </div>

      {/* Activity Timeline List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white border border-slate-200 p-4 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.noActivityTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
            {t.noActivityDesc}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
          {logs.map((log) => {
            const actionBadge = getActionBadge(log.action);

            return (
              <div
                key={log.id}
                className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-start gap-3.5 overflow-hidden">
                  <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getResourceIcon(log.resourceType)}
                  </div>

                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{log.userName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${actionBadge.bg}`}>
                        {actionBadge.label}
                      </span>
                      {log.resourceTitle && (
                        <span className="font-semibold text-xs text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded">
                          {log.resourceTitle}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {log.details || log.resourceTitle || log.action}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0 self-start sm:self-center">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimestamp(log.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
