"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  Calendar,
  User,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Bell,
} from "lucide-react";

export interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  category: "general" | "meeting" | "milestone" | "alert";
  pinned: boolean;
  authorName: string;
  createdAt: string;
}

interface AnnouncementsViewProps {
  initialOpenModal?: boolean;
  onClearInitialOpen?: () => void;
}

export function AnnouncementsView({ initialOpenModal, onClearInitialOpen }: AnnouncementsViewProps) {
  const { t, lang, showToast } = useApp();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState<AnnouncementItem["category"]>("general");
  const [formPinned, setFormPinned] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialOpenModal) {
      openCreateModal();
      if (onClearInitialOpen) onClearInitialOpen();
    }
  }, [initialOpenModal]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const res = await fetch(`/api/announcements?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setAnnouncements(data.announcements || []);
        }
      }
    } catch (err) {
      console.error("Fetch announcements error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [search, categoryFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormContent("");
    setFormCategory("general");
    setFormPinned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormCategory(item.category);
    setFormPinned(item.pinned);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      showToast(lang === "ar" ? "العنوان والمحتوى مطلوبان" : "Title and content are required", "error");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      pinned: formPinned,
    };

    try {
      if (editingItem) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingItem.id ? { ...a, ...payload } : a))
        );

        const res = await fetch(`/api/announcements/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast(t.announcementUpdated, "success");
          setIsModalOpen(false);
          fetchAnnouncements();
        } else {
          showToast(lang === "ar" ? "فشل تحديث الإعلان" : "Failed to update announcement", "error");
          fetchAnnouncements();
        }
      } else {
        const res = await fetch("/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast(t.announcementCreated, "success");
          setIsModalOpen(false);
          fetchAnnouncements();
        } else {
          showToast(lang === "ar" ? "فشل نشر الإعلان" : "Failed to post announcement", "error");
        }
      }
    } catch {
      showToast(lang === "ar" ? "خطأ بالاتصال" : "Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const prevList = [...announcements];
    setAnnouncements(announcements.filter((a) => a.id !== deleteTarget.id));

    try {
      const res = await fetch(`/api/announcements/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(t.announcementDeleted, "success");
        setDeleteTarget(null);
      } else {
        setAnnouncements(prevList);
        showToast(lang === "ar" ? "فشل حذف الإعلان" : "Failed to delete announcement", "error");
      }
    } catch {
      setAnnouncements(prevList);
      showToast(lang === "ar" ? "خطأ بالاتصال" : "Network error", "error");
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryBadge = (cat: AnnouncementItem["category"]) => {
    switch (cat) {
      case "milestone":
        return { label: t.catMilestone, bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "meeting":
        return { label: t.catMeeting, bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "alert":
        return { label: t.catAlert, bg: "bg-rose-50 text-rose-700 border-rose-200" };
      default:
        return { label: t.catGeneral, bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
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
            {t.announcementsTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.announcementsDesc}</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newAnnouncement}</span>
        </button>
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
            className="w-full ps-9 pe-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-600 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="all">{t.category}: {t.all}</option>
            <option value="general">{t.catGeneral}</option>
            <option value="meeting">{t.catMeeting}</option>
            <option value="milestone">{t.catMilestone}</option>
            <option value="alert">{t.catAlert}</option>
          </select>
        </div>
      </div>

      {/* Announcements Stream */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-white border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.noAnnouncementsTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {t.noAnnouncementsDesc}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createFirstAnnouncement}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => {
            const catBadge = getCategoryBadge(item.category);

            return (
              <div
                key={item.id}
                className={`p-5 sm:p-6 rounded-2xl bg-white border transition shadow-xs ${
                  item.pinned
                    ? "border-indigo-300 ring-1 ring-indigo-200 bg-gradient-to-b from-indigo-50/30 to-white"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.pinned && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                        <Pin className="w-3 h-3 fill-indigo-700" />
                        <span>{lang === "ar" ? "مثبت" : "Pinned"}</span>
                      </span>
                    )}

                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catBadge.bg}`}>
                      {catBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      title={t.edit}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-3 leading-snug">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-600 mt-2 whitespace-pre-line leading-relaxed">
                  {item.content}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2 font-medium text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.authorName}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post / Edit Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem ? t.edit : t.newAnnouncement}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.announcementTitle} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={lang === "ar" ? "مثال: تحديث مواعيد التسليم للمشروع القادم" : "e.g. Schedule update for upcoming release"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.category}
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as AnnouncementItem["category"])}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-600"
                >
                  <option value="general">{t.catGeneral}</option>
                  <option value="meeting">{t.catMeeting}</option>
                  <option value="milestone">{t.catMilestone}</option>
                  <option value="alert">{t.catAlert}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.announcementContent} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={lang === "ar" ? "نص الإعلان والتعليمات للفريق..." : "Write details for your team..."}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinnedToggle"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="pinnedToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  {t.announcementPinned}
                </label>
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

      {/* Delete Announcement Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t.confirmDelete}</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === "ar"
                ? `هل أنت متأكد من حذف الإعلان "${deleteTarget.title}"؟`
                : `Are you sure you want to delete announcement "${deleteTarget.title}"?`}
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
