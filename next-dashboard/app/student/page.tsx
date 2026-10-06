"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CheckCircle2, FileText, FolderKanban, LayoutDashboard, Plus, Upload, Users } from "lucide-react";
import api from "../lib/api";

export default function StudentDashboard() {
  const router = useRouter();
  const [rollNumbers, setRollNumbers] = useState(["", "", ""]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      await api.post("/projects", { title, department: "Computer Science", studentRollNumbers: rollNumbers });
      setMessage("Team created successfully.");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Could not create the team. Please sign in first.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><FolderKanban size={21} /></div><div><p className="font-bold">ProjectTrack</p><p className="text-xs text-slate-500">Student workspace</p></div></div>
        <nav className="flex-1 space-y-1 px-4 py-8"><p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Workspace</p><button className="mt-4 flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700"><LayoutDashboard size={19} /> Dashboard</button><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600"><Users size={19} /> Teams</button><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600"><CalendarCheck size={19} /> Reviews</button><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600"><Upload size={19} /> Uploads</button></nav>
      </aside>
      <main><header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 sm:px-10"><div><p className="text-sm text-slate-500">Final-year project tracker</p><h1 className="text-xl font-bold">Student Dashboard</h1></div><button onClick={() => router.push("/login")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Sign out</button></header>
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10"><section className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-700 to-cyan-500 p-8 text-white"><p className="text-sm text-indigo-100">Welcome back</p><h2 className="mt-2 text-3xl font-bold">Build your project team.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100">Create your team, monitor milestones, and submit your final project from one workspace.</p></section>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Users size={21} /></div><div><h2 className="text-xl font-bold">Create a Team</h2><p className="mt-2 text-sm leading-6 text-slate-500">Enter the three student roll numbers for your team.</p></div></div><form onSubmit={createTeam} className="mt-8 space-y-5"><label className="block text-sm font-semibold">Project title<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Smart Campus Assistant" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" /></label>{rollNumbers.map((rollNumber, index) => <label key={index} className="block text-sm font-semibold">Student {index + 1} roll number<input required value={rollNumber} onChange={(event) => setRollNumbers((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`2021CSE0${index + 43}`} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" /></label>)}{message && <p className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${message.includes("successfully") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message.includes("successfully") && <CheckCircle2 size={17} />}{message}</p>}<button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={18} /> Create team</button></form></section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Current project status</p><h2 className="mt-1 text-xl font-bold">Project progress</h2><div className="mt-6 rounded-xl bg-slate-50 p-4"><div className="flex justify-between text-sm font-semibold"><span>Overall progress</span><span className="text-indigo-600">42%</span></div><div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-full w-[42%] rounded-full bg-indigo-600" /></div><p className="mt-3 text-xs text-slate-500">3 of 7 milestones completed</p></div><div className="mt-7 space-y-5">{[["Team formation", "Completed", true], ["Guide allocation", "Completed", true], ["Project proposal", "In review", false], ["First review", "Upcoming", false]].map(([name, status, complete]) => <div key={String(name)} className="flex items-center gap-3"><div className={`grid h-5 w-5 place-items-center rounded-full ${complete ? "bg-emerald-500" : "bg-slate-300"}`}>{complete && <CheckCircle2 size={14} className="text-white" />}</div><div><p className="text-sm font-semibold">{name}</p><p className="text-xs text-slate-500">{status}</p></div></div>)}</div><button className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"><FileText size={17} /> View project details</button></section></div>
        </div>
      </main>
    </div>
  );
}
