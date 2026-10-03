"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Megaphone,
  History,
  Settings,
  LogOut,
  Globe,
  Sparkles,
  X,
} from "lucide-react";

export type NavTab = "overview" | "projects" | "tasks" | "members" | "announcements" | "activity" | "settings";

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  counts?: {
    projects: number;
    tasks: number;
    members: number;
    announcements: number;
  };
}

export function Sidebar({ currentTab, setCurrentTab, isOpenMobile, setIsOpenMobile, counts }: SidebarProps) {
  const { user, team, logout, t, lang, toggleLang } = useApp();

  const navItems = [
    {
      id: "overview" as NavTab,
      label: t.navOverview,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "projects" as NavTab,
      label: t.navProjects,
      icon: FolderKanban,
      badge: counts?.projects ? counts.projects : null,
    },
    {
      id: "tasks" as NavTab,
      label: t.navTasks,
      icon: CheckSquare,
      badge: counts?.tasks ? counts.tasks : null,
    },
    {
      id: "members" as NavTab,
      label: t.navMembers,
      icon: Users,
      badge: counts?.members ? counts.members : null,
    },
    {
      id: "announcements" as NavTab,
      label: t.navAnnouncements,
      icon: Megaphone,
      badge: counts?.announcements ? counts.announcements : null,
    },
    {
      id: "activity" as NavTab,
      label: t.navActivity,
      icon: History,
      badge: null,
    },
    {
      id: "settings" as NavTab,
      label: t.navSettings,
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelectTab = (id: NavTab) => {
    setCurrentTab(id);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 flex flex-col w-72 bg-slate-900 text-slate-200 border-e border-slate-800 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile
            ? "translate-x-0"
            : lang === "ar"
            ? "translate-x-full md:translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/20 font-bold text-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-white truncate tracking-tight">
                {team?.name || t.appTitle}
              </h1>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {t.cleanNoticeTitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpenMobile(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Utility Bar: Language switcher and User Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/70 transition"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>{lang === "ar" ? "اللغة: العربية (RTL)" : "Language: English (LTR)"}</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-xs font-semibold">
              {lang === "ar" ? "English" : "العربية"}
            </span>
          </button>

          {/* User Profile Card */}
          {user && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-full text-white font-bold text-sm shrink-0 shadow"
                  style={{ backgroundColor: user.avatarColor || "#4f46e5" }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-semibold text-white truncate">{user.name}</div>
                  <div className="text-xs text-slate-400 truncate">{user.jobTitle || user.role}</div>
                </div>
              </div>
              <button
                onClick={logout}
                title={t.logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
