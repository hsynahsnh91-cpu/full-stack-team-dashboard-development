"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  AlertTriangle,
} from "lucide-react";

export interface ProjectItem {
  id: number;
  title: string;
  description: string | null;
  status: "planning" | "in_progress" | "completed" | "on_hold";
  priority: "low" | "medium" | "high" | "urgent";
  category: string | null;
  progress: number;
  budget: string | null;
  startDate: string | null;
  dueDate: string | null;
  totalTasks?: number;
  completedTasks?: number;
  createdAt: string;
}

interface ProjectsViewProps {
  initialOpenModal?: boolean;
  onClearInitialOpen?: () => void;
}

export function ProjectsView({ initialOpenModal, onClearInitialOpen }: ProjectsViewProps) {
  const { t, lang, showToast } = useApp();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<ProjectItem["status"]>("planning");
  const [formPriority, setFormPriority] = useState<ProjectItem["priority"]>("medium");
  const [formCategory, setFormCategory] = useState("General");
  const [formBudget, setFormBudget] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formProgress, setFormProgress] = useState(0);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialOpenModal) {
      openCreateModal();
      if (onClearInitialOpen) onClearInitialOpen();
    }
  }, [initialOpenModal]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setProjects(data.projects || []);
        }
      }
    } catch (err) {
      console.error("Fetch projects error:", err);
      showToast(lang === "ar" ? "فشل تحميل المشاريع" : "Failed to load projects", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter, priorityFilter]);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormTitle("");
    setFormDescription("");
    setFormStatus("planning");
    setFormPriority("medium");
    setFormCategory("Product");
    setFormBudget("");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormDueDate("");
    setFormProgress(0);
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProjectItem) => {
    setEditingProject(p);
    setFormTitle(p.title);
    setFormDescription(p.description || "");
    setFormStatus(p.status);
    setFormPriority(p.priority);
    setFormCategory(p.category || "General");
    setFormBudget(p.budget || "");
    setFormStartDate(p.startDate || "");
    setFormDueDate(p.dueDate || "");
    setFormProgress(p.progress || 0);
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast(lang === "ar" ? "عنوان المشروع مطلوب" : "Project title is required", "error");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      status: formStatus,
      priority: formPriority,
      category: formCategory.trim() || "General",
      budget: formBudget.trim(),
      startDate: formStartDate,
      dueDate: formDueDate,
      progress: formProgress,
    };

    try {
      if (editingProject) {
        // Optimistic update
        const updatedList = projects.map((p) =>
          p.id === editingProject.id ? { ...p, ...payload } : p
        );
        setProjects(updatedList);

        const res = await fetch(`/api/projects/${editingProject.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast(t.projectUpdated, "success");
          setIsModalOpen(false);
          fetchProjects();
        } else {
          showToast(lang === "ar" ? "فشل تحديث المشروع" : "Failed to update project", "error");
          fetchProjects();
        }
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast(t.projectCreated, "success");
          setIsModalOpen(false);
          fetchProjects();
        } else {
          showToast(lang === "ar" ? "فشل إنشاء المشروع" : "Failed to create project", "error");
        }
      }
    } catch {
      showToast(lang === "ar" ? "حدث خطأ بالاتصال" : "Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    // Optimistic removal
    const prevList = [...projects];
    setProjects(projects.filter((p) => p.id !== deleteTarget.id));

    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(t.projectDeleted, "success");
        setDeleteTarget(null);
      } else {
        setProjects(prevList);
        showToast(lang === "ar" ? "فشل حذف المشروع" : "Failed to delete project", "error");
      }
    } catch {
      setProjects(prevList);
      showToast(lang === "ar" ? "حدث خطأ بالاتصال" : "Network error", "error");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: ProjectItem["status"]) => {
    switch (status) {
      case "in_progress":
        return { label: t.statusInProgress, bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "completed":
        return { label: t.statusCompleted, bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "on_hold":
        return { label: t.statusOnHold, bg: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { label: t.statusPlanning, bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const getPriorityBadge = (priority: ProjectItem["priority"]) => {
    switch (priority) {
      case "urgent":
        return { label: t.priorityUrgent, bg: "bg-rose-100 text-rose-700" };
      case "high":
        return { label: t.priorityHigh, bg: "bg-amber-100 text-amber-700" };
      case "medium":
        return { label: t.priorityMedium, bg: "bg-blue-100 text-blue-700" };
      default:
        return { label: t.priorityLow, bg: "bg-slate-100 text-slate-600" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.projectsTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.projectsDesc}</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newProject}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="w-full ps-9 pe-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>{t.status}:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="all">{t.all}</option>
            <option value="planning">{t.statusPlanning}</option>
            <option value="in_progress">{t.statusInProgress}</option>
            <option value="completed">{t.statusCompleted}</option>
            <option value="on_hold">{t.statusOnHold}</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="all">{t.priority}: {t.all}</option>
            <option value="urgent">{t.priorityUrgent}</option>
            <option value="high">{t.priorityHigh}</option>
            <option value="medium">{t.priorityMedium}</option>
            <option value="low">{t.priorityLow}</option>
          </select>

          {(search || statusFilter !== "all" || priorityFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
            >
              {t.clearFilters}
            </button>
          )}
        </div>
      </div>

      {/* Projects List / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-white border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 text-center rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.noProjectsTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {t.noProjectsDesc}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createFirstProject}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const statusBadge = getStatusBadge(p.status);
            const priorityBadge = getPriorityBadge(p.priority);

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition group shadow-xs"
              >
                <div>
                  {/* Top tags and actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityBadge.bg}`}>
                        {priorityBadge.label}
                      </span>
                      {p.category && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {p.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title={t.edit}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
                    {p.description || (lang === "ar" ? "لا يوجد وصف مدخل" : "No description provided")}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">{t.progress}</span>
                      <span className="text-indigo-600 font-bold">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer details */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    {p.dueDate ? (
                      <>
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.dueDate}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">
                        {lang === "ar" ? "بدون موعد محدد" : "No due date"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {p.budget && (
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {p.budget}
                      </span>
                    )}
                    <span className="text-slate-500 font-medium">
                      {p.totalTasks ?? 0} {lang === "ar" ? "مهام" : "tasks"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProject ? t.edit : t.newProject}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.projectTitle} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={lang === "ar" ? "مثال: إطلاق التطبيق الجديد" : "e.g. Mobile App Redesign"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.projectDescription}
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={lang === "ar" ? "تفاصيل وأهداف المشروع..." : "Goals and scope of this project..."}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.status}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProjectItem["status"])}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-600"
                  >
                    <option value="planning">{t.statusPlanning}</option>
                    <option value="in_progress">{t.statusInProgress}</option>
                    <option value="completed">{t.statusCompleted}</option>
                    <option value="on_hold">{t.statusOnHold}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.priority}
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as ProjectItem["priority"])}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-600"
                  >
                    <option value="low">{t.priorityLow}</option>
                    <option value="medium">{t.priorityMedium}</option>
                    <option value="high">{t.priorityHigh}</option>
                    <option value="urgent">{t.priorityUrgent}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.category}
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Product, Marketing, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.projectBudget}
                  </label>
                  <input
                    type="text"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="$10,000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.startDate}
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.dueDate}
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{t.progress}</span>
                  <span className="text-indigo-600 font-bold">{formProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formProgress}
                  onChange={(e) => setFormProgress(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  {submitting ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t.confirmDelete}</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === "ar"
                ? `هل أنت متأكد من حذف المشروع "${deleteTarget.title}"؟ سيتم حذف كافة المهام التابعة له.`
                : `Are you sure you want to delete project "${deleteTarget.title}"? All associated tasks will also be deleted.`}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-sm font-semibold transition"
              >
                {deleting ? t.deleting : t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
