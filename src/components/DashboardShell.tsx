"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { AuthView } from "./AuthView";
import { Sidebar, NavTab } from "./Sidebar";
import { Navbar } from "./Navbar";
import { OverviewView } from "./views/OverviewView";
import { ProjectsView } from "./views/ProjectsView";
import { TasksView } from "./views/TasksView";
import { MembersView } from "./views/MembersView";
import { AnnouncementsView } from "./views/AnnouncementsView";
import { ActivityView } from "./views/ActivityView";
import { SettingsView } from "./views/SettingsView";
import { Sparkles, Loader2 } from "lucide-react";

export function DashboardShell() {
  const { user, loading, t } = useApp();
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Quick Action flags
  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [openMemberModal, setOpenMemberModal] = useState(false);
  const [openAnnouncementModal, setOpenAnnouncementModal] = useState(false);

  // Counters for sidebar badges
  const [counts, setCounts] = useState({
    projects: 0,
    tasks: 0,
    members: 0,
    announcements: 0,
  });

  const fetchCounts = async () => {
    if (!user) return;
    try {
      const [resProjects, resTasks, resMembers, resAnnouncements] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/members"),
        fetch("/api/announcements"),
      ]);

      const [dataP, dataT, dataM, dataA] = await Promise.all([
        resProjects.ok ? resProjects.json() : { projects: [] },
        resTasks.ok ? resTasks.json() : { tasks: [] },
        resMembers.ok ? resMembers.json() : { members: [] },
        resAnnouncements.ok ? resAnnouncements.json() : { announcements: [] },
      ]);

      setCounts({
        projects: dataP.projects?.length || 0,
        tasks: dataT.tasks?.length || 0,
        members: dataM.members?.length || 0,
        announcements: dataA.announcements?.length || 0,
      });
    } catch (err) {
      console.error("Count fetch error:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCounts();
    }
  }, [user, currentTab]);

  const handleQuickAction = (action: "project" | "task" | "member" | "announcement") => {
    if (action === "project") {
      setCurrentTab("projects");
      setOpenProjectModal(true);
    } else if (action === "task") {
      setCurrentTab("tasks");
      setOpenTaskModal(true);
    } else if (action === "member") {
      setCurrentTab("members");
      setOpenMemberModal(true);
    } else if (action === "announcement") {
      setCurrentTab("announcements");
      setOpenAnnouncementModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-bounce">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-bold text-base">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>{t.loading}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        counts={counts}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar
          currentTab={currentTab}
          onOpenMobile={() => setIsOpenMobile(true)}
          onQuickAction={handleQuickAction}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {currentTab === "overview" && (
            <OverviewView
              onNavigate={(tab) => setCurrentTab(tab)}
              onQuickAction={handleQuickAction}
            />
          )}

          {currentTab === "projects" && (
            <ProjectsView
              initialOpenModal={openProjectModal}
              onClearInitialOpen={() => setOpenProjectModal(false)}
            />
          )}

          {currentTab === "tasks" && (
            <TasksView
              initialOpenModal={openTaskModal}
              onClearInitialOpen={() => setOpenTaskModal(false)}
            />
          )}

          {currentTab === "members" && (
            <MembersView
              initialOpenModal={openMemberModal}
              onClearInitialOpen={() => setOpenMemberModal(false)}
            />
          )}

          {currentTab === "announcements" && (
            <AnnouncementsView
              initialOpenModal={openAnnouncementModal}
              onClearInitialOpen={() => setOpenAnnouncementModal(false)}
            />
          )}

          {currentTab === "activity" && <ActivityView />}

          {currentTab === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
