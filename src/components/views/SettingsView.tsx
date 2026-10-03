"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Settings,
  User,
  Lock,
  Database,
  Trash2,
  Sparkles,
  ShieldCheck,
  Check,
  AlertTriangle,
} from "lucide-react";

const AVATAR_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#0891b2",
  "#4f46e5",
];

export function SettingsView() {
  const { user, updateUserLocal, t, lang, showToast, refreshUser } = useApp();

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#4f46e5");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Data Actions
  const [confirmingWipe, setConfirmingWipe] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [generatingStarter, setGeneratingStarter] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(lang === "ar" ? "الاسم مطلوب" : "Name is required", "error");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          jobTitle: jobTitle.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
          avatarColor,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        updateUserLocal(data.user);
        showToast(t.profileUpdated, "success");
      } else {
        showToast(data.error || (lang === "ar" ? "فشل التحديث" : "Failed to update"), "error");
      }
    } catch {
      showToast(lang === "ar" ? "خطأ بالاتصال" : "Network error", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast(lang === "ar" ? "يرجى إدخال كلمة المرور الحالية" : "Current password required", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast(lang === "ar" ? "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" : "Minimum 6 chars required", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(lang === "ar" ? "كلمات المرور الجديدة غير متطابقة" : "Passwords do not match", "error");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        showToast(lang === "ar" ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully", "success");
      } else {
        showToast(data.error || (lang === "ar" ? "فشل تغيير كلمة المرور" : "Failed to change password"), "error");
      }
    } catch {
      showToast(lang === "ar" ? "خطأ بالاتصال" : "Network error", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleGenerateStarter = async () => {
    setGeneratingStarter(true);
    try {
      const res = await fetch("/api/starter-data", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(
          lang === "ar"
            ? "تمت إضافة النماذج بنجاح لمساحة عملك!"
            : "Starter templates added successfully!",
          "success"
        );
      } else {
        showToast(data.error || "Failed", "error");
      }
    } catch {
      showToast(lang === "ar" ? "خطأ بالاتصال" : "Network error", "error");
    } finally {
      setGeneratingStarter(false);
    }
  };

  const handleWipeData = async () => {
    setWiping(true);
    try {
      const res = await fetch("/api/starter-data", { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setConfirmingWipe(false);
        showToast(data.message, "success");
      } else {
        showToast(data.error || "Failed", "error");
      }
    } catch {
      showToast(lang === "ar" ? "خطأ بالاتصال" : "Network error", "error");
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {t.settingsTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.settingsDesc}</p>
      </div>

      {/* Clean Site Guarantee Banner */}
      <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm text-emerald-950">{t.cleanNoticeTitle}</h3>
          <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
            {t.cleanNoticeDesc}
          </p>
        </div>
      </div>

      {/* Profile Info Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-base text-slate-900">{t.personalInfo}</h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.name} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.email}
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.jobTitle}
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.memberPhone}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 ..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.bio}
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={lang === "ar" ? "نبذة مختصرة عن مسؤولياتك وخبراتك..." : "Short bio about responsibilities..."}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none resize-none"
            />
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              {t.avatarColor}
            </label>
            <div className="flex items-center gap-3">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  style={{ backgroundColor: color }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white transition transform hover:scale-110 shadow-xs"
                >
                  {avatarColor === color && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              {savingProfile ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-base text-slate-900">{t.changePassword}</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.currentPassword}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.newPassword}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 text-sm outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-semibold transition cursor-pointer"
            >
              {savingPassword ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>

      {/* Workspace Data Management */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-base text-slate-900">{t.workspaceDataManagement}</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">
          {lang === "ar"
            ? "التحكم الكامل في محتوى مساحة العمل الخاصة بك: يمكنك تفريغ كافة البيانات في أي لحظة، أو توليد نماذج بداية عند الحاجة."
            : "Complete control over your workspace: wipe all data clean at any moment or generate starter models if needed."}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateStarter}
            disabled={generatingStarter}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold border border-indigo-200 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generatingStarter ? t.loading : t.populateStarterDataBtn}</span>
          </button>

          <button
            onClick={() => setConfirmingWipe(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold border border-rose-200 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.wipeAllDataBtn}</span>
          </button>
        </div>
      </div>

      {/* Confirm Wipe Modal */}
      {confirmingWipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t.confirmDelete}</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              {t.confirmWipe}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingWipe(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={wiping}
                onClick={handleWipeData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-sm font-semibold transition cursor-pointer"
              >
                {wiping ? t.loading : t.wipeAllDataBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
