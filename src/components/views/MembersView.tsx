"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";

export interface MemberItem {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string | null;
  status: "active" | "invited" | "inactive";
  avatarColor: string | null;
  createdAt: string;
}

interface MembersViewProps {
  initialOpenModal?: boolean;
  onClearInitialOpen?: () => void;
}

export function MembersView({ initialOpenModal, onClearInitialOpen }: MembersViewProps) {
  const { t, lang, showToast } = useApp();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("member");
  const [formDept, setFormDept] = useState("Engineering");
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState<MemberItem["status"]>("active");

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<MemberItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (initialOpenModal) {
      openAddModal();
      if (onClearInitialOpen) onClearInitialOpen();
    }
  }, [initialOpenModal]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (deptFilter !== "all") params.append("department", deptFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/members?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setMembers(data.members || []);
        }
      }
    } catch (err) {
      console.error("Fetch members error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search, deptFilter, statusFilter]);

  const openAddModal = () => {
    setEditingMember(null);
    setFormName("");
    setFormEmail("");
    setFormRole("member");
    setFormDept("Engineering");
    setFormPhone("");
    setFormStatus("active");
    setIsModalOpen(true);
  };

  const openEditModal = (m: MemberItem) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormEmail(m.email);
    setFormRole(m.role);
    setFormDept(m.department || "Engineering");
    setFormPhone(m.phone || "");
    setFormStatus(m.status);
    setIsModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showToast(lang === "ar" ? "الاسم والبريد مطلوبان" : "Name and email are required", "error");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole,
      department: formDept,
      phone: formPhone.trim(),
      status: formStatus,
    };

    try {
      if (editingMember) {
        // Optimistic update
        setMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? { ...m, ...payload } : m))
        );

        const res = await fetch(`/api/members/${editingMember.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast(t.memberUpdated, "success");
          setIsModalOpen(false);
          fetchMembers();
        } else {
          showToast(lang === "ar" ? "فشل تحديث العضو" : "Failed to update member", "error");
          fetchMembers();
        }
      } else {
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast(t.memberCreated, "success");
          setIsModalOpen(false);
          fetchMembers();
        } else {
          showToast(lang === "ar" ? "فشل إضافة العضو" : "Failed to add member", "error");
        }
      }
    } catch {
      showToast(lang === "ar" ? "خطأ بالاتصال" : "Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const prevList = [...members];
    setMembers(members.filter((m) => m.id !== deleteTarget.id));

    try {
      const res = await fetch(`/api/members/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(t.memberDeleted, "success");
        setDeleteTarget(null);
      } else {
        setMembers(prevList);
        showToast(lang === "ar" ? "فشل حذف العضو" : "Failed to delete member", "error");
      }
    } catch {
      setMembers(prevList);
      showToast(lang === "ar" ? "خطأ بالاتصال" : "Network error", "error");
    } finally {
      setDeleting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return t.roleAdmin;
      case "manager":
        return t.roleManager;
      case "developer":
        return t.roleDeveloper;
      case "designer":
        return t.roleDesigner;
      default:
        return t.roleMember;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.membersTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.membersDesc}</p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newMember}</span>
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

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="all">{t.memberDepartment}: {t.all}</option>
            <option value="Engineering">{t.deptEngineering}</option>
            <option value="Design">{t.deptDesign}</option>
            <option value="Marketing">{t.deptMarketing}</option>
            <option value="Product">{t.deptProduct}</option>
            <option value="Operations">{t.deptOperations}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="all">{t.status}: {t.all}</option>
            <option value="active">{t.statusActive}</option>
            <option value="invited">{t.statusInvited}</option>
            <option value="inactive">{t.statusInactive}</option>
          </select>
        </div>
      </div>

      {/* Members Grid / Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-white border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.noMembersTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {t.noMembersDesc}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addFirstMember}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full text-white font-extrabold text-base flex items-center justify-center shadow-xs shrink-0"
                      style={{ backgroundColor: member.avatarColor || "#4f46e5" }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-900 text-base truncate">{member.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-indigo-600 font-semibold">
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      title={t.edit}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{member.department}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-semibold ${
                    member.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : member.status === "invited"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {member.status === "active"
                    ? t.statusActive
                    : member.status === "invited"
                    ? t.statusInvited
                    : t.statusInactive}
                </span>

                <span className="text-[11px] text-slate-400">ID #{member.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingMember ? t.edit : t.newMember}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.name} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={lang === "ar" ? "مثال: م. سارة أحمد" : "e.g. Sarah Connor"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.email} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="member@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.memberRole}
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-600"
                  >
                    <option value="admin">{t.roleAdmin}</option>
                    <option value="manager">{t.roleManager}</option>
                    <option value="developer">{t.roleDeveloper}</option>
                    <option value="designer">{t.roleDesigner}</option>
                    <option value="member">{t.roleMember}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.memberDepartment}
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-600"
                  >
                    <option value="Engineering">{t.deptEngineering}</option>
                    <option value="Design">{t.deptDesign}</option>
                    <option value="Marketing">{t.deptMarketing}</option>
                    <option value="Product">{t.deptProduct}</option>
                    <option value="Operations">{t.deptOperations}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.memberPhone}
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+966 50 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.memberStatus}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as MemberItem["status"])}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-600"
                  >
                    <option value="active">{t.statusActive}</option>
                    <option value="invited">{t.statusInvited}</option>
                    <option value="inactive">{t.statusInactive}</option>
                  </select>
                </div>
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

      {/* Delete Member Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t.confirmDelete}</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === "ar"
                ? `هل أنت متأكد من حذف العضو "${deleteTarget.name}" من فريق العمل؟`
                : `Are you sure you want to remove member "${deleteTarget.name}" from the team?`}
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
                onClick={handleDeleteMember}
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
