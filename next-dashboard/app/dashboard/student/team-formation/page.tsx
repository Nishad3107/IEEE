"use client";

import { FormEvent, useState, useTransition } from "react";
import { CheckCircle2, Info, Loader2, Plus, Users, XCircle } from "lucide-react";
import { createTeam } from "./actions";

export default function TeamFormationPage() {
  const [students, setStudents] = useState(["", "", ""]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createTeam(formData);
      setToast({ type: result.ok ? "success" : "error", message: result.message });
      if (result.ok) {
        event.currentTarget.reset();
        setStudents(["", "", ""]);
      }
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Student workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Team Formation</h1><p className="mt-3 text-sm leading-6 text-slate-500">Create your project team by adding up to three classmates using their university email or roll number.</p></div>

        {toast && <div role="status" className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}><span className="mt-0.5">{toast.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}</span><span>{toast.message}</span></div>}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start gap-4"><div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Users size={23} /></div><div><h2 className="text-xl font-bold">Create a Team</h2><p className="mt-1 text-sm text-slate-500">You will automatically be included as the team creator.</p></div></div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5"><label className="block text-sm font-semibold text-slate-700" htmlFor="teamName">Team Name<input id="teamName" name="teamName" required maxLength={120} placeholder="e.g. CodeCrafters" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" /></label><div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4"><div className="flex gap-2 text-sm text-indigo-800"><Info size={17} className="mt-0.5 shrink-0" /><p>Add up to three classmates. Each value can be a roll number or university email.</p></div></div>{students.map((student, index) => <label key={index} className="block text-sm font-semibold text-slate-700" htmlFor={`student-${index + 1}`}>Student {index + 1}<div className="relative mt-2"><input id={`student-${index + 1}`} name={`student-${index + 1}`} value={student} onChange={(event) => setStudents((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={index === 0 ? "2021CSE042 or student@university.edu" : "Optional teammate identifier"} className="w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" /></div></label>)}<button type="submit" disabled={isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}{isPending ? "Creating team…" : "Create team"}</button></form>
        </section>
      </div>
    </main>
  );
}
