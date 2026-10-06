"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Loader2 } from "lucide-react";
import api from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { role, email, password });
      localStorage.setItem("accessToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      router.push("/");
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
        <section className="hidden bg-gradient-to-br from-indigo-700 to-cyan-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div><div className="flex items-center gap-3"><FolderKanban size={28} /><span className="text-xl font-bold">ProjectTrack</span></div><h1 className="mt-24 text-5xl font-bold leading-tight">Every milestone in one clear workspace.</h1><p className="mt-6 text-indigo-100">Teams, guides, reviews, progress, and submissions for your final-year project.</p></div>
          <p className="text-sm text-indigo-100">Final-Year Project Tracker</p>
        </section>
        <section className="flex items-center px-6 py-12 sm:px-12"><div className="w-full"><div className="mb-8 lg:hidden"><p className="font-bold text-indigo-600">ProjectTrack</p></div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Welcome back</p><h2 className="mt-2 text-3xl font-bold">Sign in to your account</h2><p className="mt-3 text-sm text-slate-500">Choose your role to continue.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5"><label className="block text-sm font-semibold">Role<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"><option value="STUDENT">Student</option><option value="GUIDE">Guide</option><option value="COORDINATOR">Coordinator</option></select></label><label className="block text-sm font-semibold">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" placeholder="you@university.edu" /></label><label className="block text-sm font-semibold">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" placeholder="Your password" /></label>{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{loading && <Loader2 size={18} className="animate-spin" />}{loading ? "Signing in…" : "Sign in"}</button></form>
        </div></section>
      </div>
    </main>
  );
}
