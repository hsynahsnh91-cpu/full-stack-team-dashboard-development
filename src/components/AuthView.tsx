"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Sparkles, ShieldCheck, ArrowRight, ArrowLeft, Globe, Lock, Mail, User, Briefcase, Users } from "lucide-react";

export function AuthView() {
  const { login, register, t, lang, toggleLang } = useApp();
  const [mode, setMode] = useState<"login" | "register">("register"); // Default to register because the database is 100% clean and fresh!

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [teamName, setTeamName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await login(email, password);
        if (!res.ok) {
          setError(res.error || "فشل تسجيل الدخول");
        }
      } else {
        if (!name.trim()) {
          setError(lang === "ar" ? "يرجى كتابة الاسم الكامل" : "Please enter your full name");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError(lang === "ar" ? "كلمة المرور يجب أن لا تقل عن 6 أحرف" : "Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        const res = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          jobTitle: jobTitle.trim() || undefined,
          teamName: teamName.trim() || undefined,
        });
        if (!res.ok) {
          setError(res.error || "فشل إنشاء الحساب");
        }
      }
    } catch {
      setError(lang === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 md:p-10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 end-0 -mt-20 -me-20 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 start-0 -mb-20 -ms-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Top Header with Language Switch */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">
              {t.appTitle}
            </span>
          </div>
        </div>

        <button
          onClick={toggleLang}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition shadow-xs"
        >
          <Globe className="w-4 h-4 text-slate-500" />
          <span>{lang === "ar" ? "English" : "العربية"}</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-8 z-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
          {/* Explicit Clean Site Banner */}
          <div className="mb-6 p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 leading-relaxed font-medium">
              <strong className="font-bold block mb-0.5">
                {lang === "ar" ? "مساحة عمل نظيفة 100%" : "100% Clean Workspace Policy"}
              </strong>
              {t.cleanNoticeDesc}
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.register}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.login}
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === "register" ? t.register : t.login}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {mode === "register" ? t.registerDesc : t.loginDesc}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.name} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute start-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang === "ar" ? "مثال: م. أحمد عبد الله" : "e.g. Alex Morgan"}
                      className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.jobTitle}
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute start-3 top-3.5" />
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={lang === "ar" ? "مثال: مدير تقني / Tech Lead" : "e.g. Tech Lead"}
                      className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.teamName}
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute start-3 top-3.5" />
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder={lang === "ar" ? "مثال: فريق الابتكار والتطوير" : "e.g. Acme Innovations"}
                      className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.email} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute start-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.password} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition"
                />
              </div>
              {mode === "register" && (
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === "ar" ? "6 أحرف كحد أدنى" : "Minimum 6 characters"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <span>{t.loading}</span>
              ) : (
                <>
                  <span>{mode === "register" ? t.register : t.login}</span>
                  {lang === "ar" ? (
                    <ArrowLeft className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            {mode === "register" ? (
              <p>
                {t.alreadyHaveAccount}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  {t.login}
                </button>
              </p>
            ) : (
              <p>
                {t.dontHaveAccount}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  {t.register}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-center text-xs text-slate-400 py-3 z-10">
        <p>{t.cleanSiteNotice}</p>
      </div>
    </div>
  );
}
