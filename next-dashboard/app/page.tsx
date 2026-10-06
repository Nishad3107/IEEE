"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Search,
  Send,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import api from "./lib/api";

type Status = "Approved" | "Pending" | "Scheduled" | "Submitted" | "Not Submitted";

type Team = {
  id?: string;
  name: string;
  members: number;
  guide: string;
  review: Status;
  submission: Status;
};

const teams: Team[] = [
  { id: "demo-codecrafters", name: "CodeCrafters", members: 4, guide: "Dr. Priya Mehta", review: "Approved", submission: "Submitted" },
  { id: "demo-dataminds", name: "DataMinds", members: 3, guide: "Prof. Rahul Verma", review: "Scheduled", submission: "Not Submitted" },
  { id: "demo-pixel-pioneers", name: "Pixel Pioneers", members: 4, guide: "Dr. Ananya Rao", review: "Pending", submission: "Not Submitted" },
  { id: "demo-cloud-nine", name: "Cloud Nine", members: 3, guide: "Dr. Vikram Shah", review: "Approved", submission: "Submitted" },
];

const fallbackGuides = [
  { id: "", name: "Dr. Priya Mehta" },
  { id: "", name: "Prof. Rahul Verma" },
  { id: "", name: "Dr. Ananya Rao" },
  { id: "", name: "Dr. Vikram Shah" },
  { id: "", name: "Prof. Neha Kapoor" },
];

const stats = [
  { label: "Total teams", value: "42", icon: Users },
  { label: "Guides allocated", value: "38", icon: BookOpen },
  { label: "Reviews pending", value: "12", icon: ClipboardCheck },
  { label: "Submissions received", value: "24", icon: FileCheck2 },
];

function StatusBadge({ status }: { status: Status }) {
  const classes: Record<Status, string> = {
    Approved: "bg-emerald-50 text-emerald-700",
    Submitted: "bg-emerald-50 text-emerald-700",
    Scheduled: "bg-blue-50 text-blue-700",
    Pending: "bg-amber-50 text-amber-700",
    "Not Submitted": "bg-slate-100 text-slate-600",
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}>{status}</span>;
}

function GuidePreferenceForm({ projectId }: { projectId?: string }) {
  const [preferences, setPreferences] = useState(["", "", ""]);
  const [saved, setSaved] = useState(false);
  const [guides, setGuides] = useState(fallbackGuides);

  useEffect(() => {
    api.get("/guides").then(({ data }) => {
      if (data.guides?.length) setGuides(data.guides.map((guide: { id: string; name: string }) => ({ id: guide.id, name: guide.name })));
    }).catch(() => undefined);
  }, []);

  const updatePreference = (index: number, value: string) => {
    setPreferences((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
    setSaved(false);
  };

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (projectId && !projectId.startsWith("demo-")) {
      await api.post(`/projects/${projectId}/guide-preferences`, { guideIds: preferences });
    }
    setSaved(true);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpen size={21} /></div>
        <div>
          <h2 className="text-lg font-bold">Guide Preferences</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Select your top three preferred guides.</p>
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={savePreferences}>
        {preferences.map((preference, index) => (
          <div key={index}>
            <label htmlFor={`guide-${index}`} className="mb-2 block text-sm font-semibold text-slate-700">Preference {index + 1}</label>
            <select
              id={`guide-${index}`}
              required
              value={preference}
              onChange={(event) => updatePreference(index, event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
            >
              <option value="">Choose a guide</option>
              {guides.map((guide) => <option key={`${guide.id}-${guide.name}`} value={guide.id || guide.name} disabled={preferences.includes(guide.id || guide.name) && preference !== (guide.id || guide.name)}>{guide.name}</option>)}
            </select>
          </div>
        ))}
        {saved && <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={17} /> Preferences saved successfully.</p>}
        <button className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Save preferences</button>
      </form>
    </section>
  );
}

function ReviewScheduling({ projectId }: { projectId?: string }) {
  const [scheduled, setScheduled] = useState(false);
  const [team, setTeam] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  async function scheduleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (projectId && !projectId.startsWith("demo-")) {
      await api.post("/reviews", { projectId, scheduledStart: `${date}T${time}:00`, scheduledEnd: `${date}T${time}:30` });
    }
    setScheduled(true);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><CalendarDays size={21} /></div>
        <div><h2 className="text-lg font-bold">Review Scheduling</h2><p className="mt-1 text-sm text-slate-500">Schedule a review for a project team.</p></div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={scheduleReview}>
        <label className="block text-sm font-semibold text-slate-700">Selected team
          <select required value={team} onChange={(event) => setTeam(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"><option value="">Choose a team</option>{teams.map((team) => <option key={team.name} value={team.name}>{team.name}</option>)}</select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">Date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" /></label>
          <label className="block text-sm font-semibold text-slate-700">Time<input required type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" /></label>
        </div>
        {scheduled && <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={17} /> Review scheduled successfully.</p>}
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"><CalendarDays size={17} /> Schedule review</button>
      </form>
    </section>
  );
}

function FinalSubmissionRecord({ projectId }: { projectId?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function submitFinalProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    if (projectId && !projectId.startsWith("demo-")) {
      const formData = new FormData();
      formData.append("report", file);
      await api.post(`/projects/${projectId}/final-submission`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    }
    setSubmitted(true);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><FileText size={21} /></div>
        <div><h2 className="text-lg font-bold">Final Submission Record</h2><p className="mt-1 text-sm text-slate-500">Upload your final project report as a PDF.</p></div>
      </div>

      <form className="mt-6" onSubmit={submitFinalProject}>
        <label htmlFor="final-report" className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center hover:border-indigo-400 hover:bg-indigo-50/40">
          <UploadCloud size={28} className="text-indigo-600" />
          <p className="mt-3 text-sm font-semibold">{file ? file.name : "Upload final PDF report"}</p>
          <p className="mt-1 text-xs text-slate-500">PDF format only · Maximum 10 MB</p>
          <input id="final-report" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setSubmitted(false); }} />
        </label>
        {submitted && <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={17} /> Final project submitted successfully.</p>}
        <button disabled={!file} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-4 text-base font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"><Send size={19} /> Submit Final Project</button>
      </form>
    </section>
  );
}

export default function CoordinatorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [teamRows, setTeamRows] = useState(teams);
  useEffect(() => {
    api.get("/projects").then(({ data }) => {
      if (data.projects?.length) {
        setTeamRows(data.projects.map((project: { id: string; title: string; member_count: number; guide: string; status: string }) => ({
          id: project.id, name: project.title || "Untitled project", members: project.member_count, guide: project.guide,
          review: "Pending" as Status, submission: (project.status === "SUBMITTED" ? "Submitted" : "Not Submitted") as Status,
        })));
      }
    }).catch(() => undefined);
  }, []);
  const filteredTeams = teamRows.filter((team) => `${team.name} ${team.guide}`.toLowerCase().includes(search.toLowerCase()));
  const activeProjectId = teamRows[0]?.id;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {sidebarOpen && <button aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" />}
      <aside className={`hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><FolderKanban size={21} /></div><div><p className="font-bold">ProjectTrack</p><p className="text-xs text-slate-500">Coordinator portal</p></div></div><button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={20} /></button></div>
        <nav className="flex-1 space-y-1 px-4 py-8"><p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Management</p><button className="mt-4 flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700"><LayoutDashboard size={19} /> Dashboard</button><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-slate-50"><Users size={19} /> Teams</button><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-slate-50"><BookOpen size={19} /> Guides</button><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-slate-50"><ClipboardCheck size={19} /> Reviews</button><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-slate-50"><FileCheck2 size={19} /> Submissions</button></nav>
        <div className="border-t border-slate-100 p-4"><div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-700">AK</div><div><p className="text-sm font-semibold">Anita Kapoor</p><p className="text-xs text-slate-500">Coordinator</p></div></div></div>
      </aside>

      <div><header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div className="flex items-center gap-4"><button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu size={22} /></button><div><p className="text-sm text-slate-500">Academic Year 2024–25</p><h1 className="text-xl font-bold">Coordinator Dashboard</h1></div></div><button aria-label="Notifications" className="relative rounded-xl border border-slate-200 p-2.5"><Bell size={20} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-600" /></button></header>
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Project overview</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Manage project progress at a glance.</h2><p className="mt-3 max-w-2xl text-sm text-slate-500">Monitor teams, guide preferences, reviews, and final submissions.</p></div>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><Icon size={19} className="text-indigo-600" /></div><p className="mt-4 text-3xl font-bold">{value}</p></div>)}</div>
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold">Project Teams</h2><p className="mt-1 text-sm text-slate-500">Track guide allocation, reviews, and submissions.</p></div><div className="relative w-full sm:w-64"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams or guides" className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">Team Name</th><th className="px-6 py-4">Allocated Guide</th><th className="px-6 py-4">Review Status</th><th className="px-6 py-4">Final Submission</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredTeams.map((team) => <tr key={team.name} className="hover:bg-slate-50"><td className="px-6 py-5"><p className="font-semibold">{team.name}</p><p className="text-xs text-slate-500">{team.members} members</p></td><td className="px-6 py-5 text-sm text-slate-600">{team.guide}</td><td className="px-6 py-5"><StatusBadge status={team.review} /></td><td className="px-6 py-5"><StatusBadge status={team.submission} /></td></tr>)}</tbody></table></div></section>
          <div className="mt-6 grid gap-6 xl:grid-cols-3"><GuidePreferenceForm projectId={activeProjectId} /><ReviewScheduling projectId={activeProjectId} /><FinalSubmissionRecord projectId={activeProjectId} /></div>
        </main>
      </div>
    </div>
  );
}
