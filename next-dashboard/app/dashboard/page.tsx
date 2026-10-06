"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(role === "student" ? "/student" : role === "guide" ? "/guide" : "/");
  }, [loading, role, router, user]);

  return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Loading your workspace…</main>;
}
