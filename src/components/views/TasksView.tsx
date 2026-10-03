"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  User,
  Tag,
  ArrowRight,
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  AlertTriangle,
} from "lucide-react";

export interface TaskItem {
  id: number;
  projectId: number | null;
  projectTitle?: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "in_review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo: string | null;
  assignedEmail: string | null;
  dueDate: string | null;
  tags: string | null;
  createdAt: string;
}

interface ProjectOption {
  id: number;
  title: string;
}

interface TasksViewProps {
  initialOpenModal?: boolean;
  onClearInitialOpen?: () => void;
}

export function TasksView({ initialOpenModal, onClearInitialOpen }: TasksViewProps) {
  const { t, lang, showToast } = useApp();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & View Mode
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formProjectId, setFormProjectId] = useState<string>("");
  const [formStatus, setFormStatus] = useState<TaskItem["status"]>("todo");
  const [formPriority, setFormPriority] = useState<TaskItem["priority"]>("medium");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formAssignedEmail, setFormAssignedEmail] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formTags, setFormTags] = useState("");

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<TaskItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialOpenModal) {
      openCreateModal();
      if (onClearInitialOpen) onClearInitialOpen();
    }
  }, [initialOpenModal]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (projectFilter !== "all") params.append("projectId", projectFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setTasks(data.tasks || []);
        }
      }
    } catch (err) {
      console.error("Fetch tasks error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setProjects(data.projects.map((p: { id: number; title: string }) => ({ id: p.id, title: p.title })));
        }
      }
    } catch (err) {
      console.error("Fetch projects error:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [search, projectFilter, statusFilter, priorityFilter]);

  const openCreateModal = (defaultStatus?: TaskItem["status"]) => {
    setEditingTask(null);
    setFormTitle("");
    setFormDescription("");
    setFormProjectId(projects.length > 0 ? String(projects[0].id) : "");
    setFormStatus(defaultStatus || "todo");
    setFormPriority("medium");
    setFormAssignedTo("");
    setFormAssignedEmail("");
    setFormDueDate(new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]);
    setFormTags("");
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || "");
    setFormProjectId(task.projectId ? String(task.projectId) : "");
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormAssignedTo(task.assignedTo || "");
    setFormAssignedEmail(task.assignedEmail || "");
    setFormDueDate(task.dueDate || "");
    setFormTags(task.tags || "");
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast(lang === "ar" ? "عنوان المهمة مطلوب" : "Task title is required", "error");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      projectId: formProjectId ? parseInt(formProjectId, 10) : null,
      status: formStatus,
      priority: formPriority,
      assignedTo: formAssignedTo.trim(),
      assignedEmail: formAssignedEmail.trim(),
      dueDate: formDueDate,
      tags: formTags.trim(),
    };

    try {
      if (editingTask) {
        // Optimistic update
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? { ...t, ...payload } : t))
        );

        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast(t.taskUpdated, "success");
          setIsModalOpen(false);
          fetchTasks();
        } else {
          showToast(lang === "ar" ? "فشل تحديث المهمة" : "Failed to update task", "error");
          fetchTasks();
        }
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast(t.taskCreated, "success");
          setIsModalOpen(false);
          fetchTasks();
        } else {
          showToast(lang === "ar" ? "فشل إنشاء المهمة" : "Failed to create task", "error");
        }
      }
    } catch {
      showToast(lang === "ar" ? "خطأ بالاتصال" : "Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Optimistic Quick Status Update (Kanban arrow / toggle)
  const handleOptimisticStatusChange = async (taskId: number, newStatus: TaskItem["status"]) => {
    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, status: newStatus } : item))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setTasks(prevTasks);
        showToast(lang === "ar" ? "فشل تحديث الحالة" : "Failed to update status", "error");
      }
    } catch {
      setTasks(prevTasks);
      showToast(lang === "ar" ? "خطأ بالاتصال" : "Network error", "error");
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const prevList = [...tasks];
    setTasks(tasks.filter((t) => t.id !== deleteTarget.id));

    try {
      const res = await fetch(`/api/tasks/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(t.taskDeleted, "success");
        setDeleteTarget(null);
      } else {
        setTasks(prevList);
        showToast(lang === "ar" ? "فشل حذف المهمة" : "Failed to delete task", "error");
      }
    } catch {
      setTasks(prevList);
      showToast(lang === "ar" ? "خطأ بالاتصال" : "Network error", "error");
    } finally {
      setDeleting(false);
    }
  };

  const kanbanColumns: { id: TaskItem["status"]; title: string; color: string }[] = [
    { id: "todo", title: t.taskStatusTodo, color: "border-slate-300" },
    { id: "in_progress", title: t.taskStatusInProgress, color: "border-blue-400" },
    { id: "in_review", title: t.taskStatusInReview, color: "border-purple-400" },
    { id: "completed", title: t.taskStatusCompleted, color: "border-emerald-400" },
  ];

  const getPriorityBadge = (p: TaskItem["priority"]) => {
    switch (p) {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.tasksTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.tasksDesc}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "kanban" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{t.viewKanban}</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.viewList}</span>
            </button>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newTask}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="w-full ps-9 pe-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">{t.navProjects}: {t.all}</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          {viewMode === "list" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="all">{t.status}: {t.all}</option>
              <option value="todo">{t.taskStatusTodo}</option>
              <option value="in_progress">{t.taskStatusInProgress}</option>
              <option value="in_review">{t.taskStatusInReview}</option>
              <option value="completed">{t.taskStatusCompleted}</option>
            </select>
          )}

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
        </div>
      </div>

      {/* Main Tasks Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200 p-4 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 text-center rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.noTasksTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {t.noTasksDesc}
          </p>
          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createFirstTask}</span>
          </button>
        </div>
      ) : viewMode === "kanban" ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{col.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white font-bold text-slate-600 border border-slate-200">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openCreateModal(col.id)}
                    className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-slate-900 transition"
                    title={t.newTask}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      {lang === "ar" ? "لا توجد مهام في هذا العمود" : "No tasks in this stage"}
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const priorityBadge = getPriorityBadge(task.priority);

                      return (
                        <div
                          key={task.id}
                          className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-md transition group"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityBadge.bg}`}>
                              {priorityBadge.label}
                            </span>
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-1 hover:text-indigo-600"
                                title={t.edit}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(task)}
                                className="p-1 hover:text-rose-600"
                                title={t.delete}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm leading-snug">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {task.projectTitle && task.projectTitle !== "No Project" && (
                            <div className="mt-2 text-[11px] font-medium text-indigo-600 bg-indigo-50/60 px-2 py-0.5 rounded w-fit">
                              {task.projectTitle}
                            </div>
                          )}

                          {/* Footer Info */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            {task.dueDate ? (
                              <div className="flex items-center gap-1 text-slate-600">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{task.dueDate}</span>
                              </div>
                            ) : (
                              <span />
                            )}

                            {task.assignedTo && (
                              <div className="flex items-center gap-1 font-medium text-slate-700">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[80px]">{task.assignedTo}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Optimistic Stage Advance buttons */}
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            {col.id !== "todo" && (
                              <button
                                onClick={() => {
                                  const prevMap: Record<TaskItem["status"], TaskItem["status"]> = {
                                    in_progress: "todo",
                                    in_review: "in_progress",
                                    completed: "in_review",
                                    todo: "todo",
                                  };
                                  handleOptimisticStatusChange(task.id, prevMap[col.id]);
                                }}
                                className="text-[10px] text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 flex items-center gap-0.5"
                                title={lang === "ar" ? "المرحلة السابقة" : "Previous Stage"}
                              >
                                {lang === "ar" ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
                                <span>{lang === "ar" ? "رجوع" : "Back"}</span>
                              </button>
                            )}

                            {col.id !== "completed" && (
                              <button
                                onClick={() => {
                                  const nextMap: Record<TaskItem["status"], TaskItem["status"]> = {
                                    todo: "in_progress",
                                    in_progress: "in_review",
                                    in_review: "completed",
                                    completed: "completed",
                                  };
                                  handleOptimisticStatusChange(task.id, nextMap[col.id]);
                                }}
                                className="ms-auto text-[10px] text-indigo-600 font-bold hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 flex items-center gap-0.5"
                                title={lang === "ar" ? "نقل للمرحلة التالية" : "Advance Stage"}
                              >
                                <span>{lang === "ar" ? "تقدم" : "Next"}</span>
                                {lang === "ar" ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const priorityBadge = getPriorityBadge(task.priority);
              const isCompleted = task.status === "completed";

              return (
                <div
                  key={task.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition ${
                    isCompleted ? "bg-slate-50/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox for quick optimistic completion toggle */}
                    <button
                      onClick={() =>
                        handleOptimisticStatusChange(
                          task.id,
                          isCompleted ? "todo" : "completed"
                        )
                      }
                      className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                        isCompleted
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 hover:border-indigo-600 bg-white"
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-semibold text-sm ${
                            isCompleted ? "line-through text-slate-400" : "text-slate-900"
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityBadge.bg}`}>
                          {priorityBadge.label}
                        </span>
                        {task.projectTitle && task.projectTitle !== "No Project" && (
                          <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                            {task.projectTitle}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ps-8 sm:ps-0">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleOptimisticStatusChange(task.id, e.target.value as TaskItem["status"])
                      }
                      className="text-xs rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
                    >
                      <option value="todo">{t.taskStatusTodo}</option>
                      <option value="in_progress">{t.taskStatusInProgress}</option>
                      <option value="in_review">{t.taskStatusInReview}</option>
                      <option value="completed">{t.taskStatusCompleted}</option>
                    </select>

                    {task.dueDate && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {task.dueDate}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title={t.edit}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTask ? t.edit : t.newTask}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.taskTitle} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={lang === "ar" ? "مثال: تجهيز قاعدة البيانات وتأمين JWT" : "e.g. Implement JWT auth & database"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.taskDescription}
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={lang === "ar" ? "شرح وملاحظات المهمة..." : "Task details & notes..."}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none resize-none"
                />
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.selectProject}
                  </label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-600"
                  >
                    <option value="">{lang === "ar" ? "-- بدون مشروع محدد --" : "-- No specific project --"}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.status}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskItem["status"])}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-600"
                  >
                    <option value="todo">{t.taskStatusTodo}</option>
                    <option value="in_progress">{t.taskStatusInProgress}</option>
                    <option value="in_review">{t.taskStatusInReview}</option>
                    <option value="completed">{t.taskStatusCompleted}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.priority}
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskItem["priority"])}
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
                    {t.assignedTo}
                  </label>
                  <input
                    type="text"
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    placeholder={lang === "ar" ? "اسم الشخص المكلف" : "Assignee Name"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.tags}
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Frontend, API, Bug, Urgency"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
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
                ? `هل أنت متأكد من حذف المهمة "${deleteTarget.title}"؟`
                : `Are you sure you want to delete task "${deleteTarget.title}"?`}
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
                onClick={handleDeleteTask}
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
