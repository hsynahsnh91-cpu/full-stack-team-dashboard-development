"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Menu, ShieldCheck } from "lucide-react";
import { NavTab } from "./Sidebar";

interface NavbarProps {
  currentTab: NavTab;
  onOpenMobile: () => void;
  onQuickAction?: (action: "project" | "task" | "member" | "announcement") => void;
}

export function Navbar({ currentTab, onOpenMobile }: NavbarProps) {
  const { user, t } = useApp();

  const getTabTitle = () => {
    switch (currentTab) {
      case "overview":
        return t.navOverview;
      case "projects":
        return t.projectsTitle;
      case "tasks":
        return t.tasksTitle;
      case "members":
        return t.membersTitle;
      case "announcements":
        return t.announcementsTitle;
      case "activity":
        return t.activityTitle;
      case "settings":
        return t.settingsTitle;
      default:
        return t.appTitle;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {getTabTitle()}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Clean site indicator tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t.cleanNoticeTitle}</span>
        </div>

        {/* User avatar indicator */}
        {user && (
          <div className="flex items-center gap-2 ps-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs"
              style={{ backgroundColor: user.avatarColor || "#4f46e5" }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:inline-block text-sm font-semibold text-slate-700">
              {user.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
