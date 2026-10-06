"use client";

import { useState, type FormEvent } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileUp,
  FolderKanban,
  GraduationCap,
  Users,
} from "lucide-react";

const navigation = [
  { label: "Teams", icon: Users, active: true },
  { label: "Guides", icon: BookOpen, active: false },
  { label: "Reviews", icon: ClipboardList, active: false },
  { label: "Uploads", icon: FileUp, active: false },
];

export default function StudentDashboard() {
  const [rollNumbers, setRollNumbers] = useState(["", "", ""]);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const complete = rollNumbers.every((rollNumber) => rollNumber.trim());
    setIsSuccess(Boolean(complete));
    setMessage(
      complete
        ? "Team details are ready to submit."
        : "Enter all three student roll numbers to continue.",
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-7 md:flex">
          <a href="#" className="mb-12 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <FolderKanban size={21} />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight">ProjectHub</span>
              <span className="block text-xs text-slate-500">Student workspace</span>
            </span>
          </a>

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>
          <nav className="space-y-1" aria-label="Main navigation">
            {navigation.map(({ label, icon: Icon, active }) => (
              <a
                key={label}
                href="#"
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={18} />
                {label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />}
              </a>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
              <GraduationCap size={19} />
            </div>
            <p className="text-sm font-semibold">Need a hand?</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Check the project guide for tips and requirements.
            </p>
            <a href="#guides" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800">
              Open guides <ChevronRight size={14} />
            </a>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 md:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <FolderKanban size={19} />
              </span>
              <span className="text-sm font-bold">ProjectHub</span>
            </div>
            <p className="hidden text-sm text-slate-500 md:block">
              Student workspace <span className="px-1 text-slate-300">/</span>{" "}
              <span className="font-medium text-slate-700">Teams</span>
            </p>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">Student</p>
                <p className="text-xs text-slate-500">Project workspace</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700" aria-label="Student profile">
                S
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="mb-8">
              <p className="mb-2 text-sm font-medium text-indigo-700">Project workspace</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Student Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Build your team, keep up with project milestones, and stay on track for your next review.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <section id="teams" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Create a Team</h2>
                    <p className="mt-1 text-sm text-slate-500">Add the roll numbers of all three team members.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {rollNumbers.map((rollNumber, index) => (
                    <div key={index}>
                      <label htmlFor={`student-${index + 1}`} className="mb-1.5 block text-sm font-medium text-slate-700">
                        Student {index + 1} roll number
                      </label>
                      <input
                        id={`student-${index + 1}`}
                        type="text"
                        required
                        value={rollNumber}
                        onChange={(event) => {
                          const value = event.target.value;
                          setRollNumbers((current) => current.map((item, i) => (i === index ? value : item)));
                          setMessage("");
                        }}
                        placeholder={`e.g. 2025CS00${index + 1}`}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      />
                    </div>
                  ))}

                  {message && (
                    <p role="status" className={`text-sm ${isSuccess ? "text-emerald-700" : "text-rose-600"}`}>
                      {message}
                    </p>
                  )}

                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200">
                    <Users size={17} /> Create team
                  </button>
                </form>
                <p className="mt-4 text-xs leading-5 text-slate-400">Make sure each roll number is correct before submitting.</p>
              </section>

              <section id="reviews" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Current Project Status</h2>
                    <p className="mt-1 text-sm text-slate-500">Your team&apos;s progress at a glance.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">In progress</span>
                    <span className="text-xs font-medium text-amber-800">2 of 4 milestones</span>
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-900">Your project</h3>
                  <p className="mt-1 text-sm text-slate-600">Team and project details will appear here.</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-amber-100">
                    <div className="h-full w-1/2 rounded-full bg-amber-500" />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">50% complete</p>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-600" />
                    <div><p className="text-sm font-medium">Team registration</p><p className="mt-1 text-xs text-slate-500">Complete your team details</p></div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-600" />
                    <div><p className="text-sm font-medium">Project proposal</p><p className="mt-1 text-xs text-slate-500">Upload your proposal for review</p></div>
                  </div>
                  <div className="flex gap-3">
                    <span className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-indigo-500 bg-white ring-4 ring-indigo-50" />
                    <div><p className="text-sm font-medium">Progress review</p><p className="mt-1 text-xs text-slate-500">Upcoming milestone</p></div>
                  </div>
                  <div className="flex gap-3">
                    <span className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-200 bg-white" />
                    <div><p className="text-sm font-medium text-slate-500">Final submission</p><p className="mt-1 text-xs text-slate-400">Submit your completed project</p></div>
                  </div>
                </div>

                <a href="#uploads" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-800">
                  View project details <ChevronRight size={16} />
                </a>
              </section>
            </div>

            <section id="uploads" className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><FileUp size={19} /></div>
                <div>
                  <h2 className="text-sm font-semibold">Progress logs and document uploads</h2>
                  <p className="mt-1 text-xs text-slate-500">Your team&apos;s latest files will appear here.</p>
                </div>
              </div>
              <a href="#uploads" className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Open uploads <ChevronRight size={15} />
              </a>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
