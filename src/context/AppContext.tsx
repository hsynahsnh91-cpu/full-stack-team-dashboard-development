"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, Language } from "@/lib/translations";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  jobTitle?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarColor?: string | null;
  createdAt?: string;
}

export interface TeamInfo {
  id: number;
  name: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AppContextType {
  user: UserProfile | null;
  team: TeamInfo | null;
  loading: boolean;
  lang: Language;
  t: typeof translations.ar;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  login: (email: string, pass: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    jobTitle?: string;
    teamName?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserLocal: (updated: Partial<UserProfile>) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Language>("ar");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Check saved language preference or browser default
    const savedLang = localStorage.getItem("app_lang") as Language | null;
    if (savedLang === "ar" || savedLang === "en") {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const toggleLang = () => {
    setLang(lang === "ar" ? "en" : "ar");
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user) {
          setUser(data.user);
          setTeam(data.team || null);
          return;
        }
      }
      setUser(null);
      setTeam(null);
    } catch (err) {
      console.error("Refresh user error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || "فشل تسجيل الدخول" };
      }
      setUser(data.user);
      await refreshUser();
      showToast(lang === "ar" ? "تم تسجيل الدخول بنجاح!" : "Signed in successfully!", "success");
      return { ok: true };
    } catch {
      return { ok: false, error: "تعذر الاتصال بالخادم" };
    }
  };

  const register = async (formData: {
    name: string;
    email: string;
    password: string;
    jobTitle?: string;
    teamName?: string;
  }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || "فشل إنشاء الحساب" };
      }
      setUser(data.user);
      setTeam(data.team || null);
      showToast(lang === "ar" ? "تم إنشاء الحساب ومساحة العمل بنجاح!" : "Account created successfully!", "success");
      return { ok: true };
    } catch {
      return { ok: false, error: "تعذر الاتصال بالخادم" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setTeam(null);
      showToast(lang === "ar" ? "تم تسجيل الخروج بنجاح" : "Signed out successfully", "info");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const updateUserLocal = (updated: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const t = translations[lang];

  return (
    <AppContext.Provider
      value={{
        user,
        team,
        loading,
        lang,
        t,
        setLang,
        toggleLang,
        login,
        register,
        logout,
        refreshUser,
        updateUserLocal,
        showToast,
        toasts,
        removeToast,
      }}
    >
      <div dir={lang === "ar" ? "rtl" : "ltr"} className={lang === "ar" ? "font-sans" : "font-sans"}>
        {children}
        {/* Toast Container */}
        <div className="fixed bottom-5 end-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
                toast.type === "success"
                  ? "bg-emerald-600 text-white shadow-emerald-950/20"
                  : toast.type === "error"
                  ? "bg-rose-600 text-white shadow-rose-950/20"
                  : "bg-slate-800 text-white shadow-slate-950/20"
              }`}
            >
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 transition-opacity text-base font-bold px-1"
                aria-label="Close notification"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
