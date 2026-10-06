"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  Menu,
  Network,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

export type UserRole = "student" | "guide" | "coordinator";

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

const roleNavigation: Record<UserRole, NavigationItem[]> = {
  student: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "Team Formation", href: "/dashboard/student/team-formation", icon: Users },
    { label: "Guide Selection", href: "/student#guides", icon: BookOpen },
    { label: "Final Submission", href: "/student#submission", icon: FileCheck2 },
  ],
  guide: [
    { label: "Dashboard", href: "/guide", icon: LayoutDashboard },
    { label: "Assigned Teams", href: "/guide#teams", icon: Users },
    { label: "Review Schedule", href: "/guide#reviews", icon: CalendarDays },
  ],
  coordinator: [
    { label: "System Overview", href: "/", icon: LayoutDashboard },
    { label: "All Teams", href: "/#teams", icon: Users },
    { label: "Allocations", href: "/#allocations", icon: Network },
  ],
};

export default function Sidebar({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = roleNavigation[userRole];

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
      >
        <Menu size={20} />
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <Link href={userRole === "student" ? "/student" : userRole === "guide" ? "/guide" : "/"} onClick={() => setOpen(false)} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><ShieldCheck size={21} /></span>
            <span><span className="block font-bold tracking-tight text-slate-900">ProjectTrack</span><span className="block text-xs capitalize text-slate-500">{userRole} workspace</span></span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close navigation"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 py-8" aria-label={`${userRole} navigation`}>
          <p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Workspace</p>
          <div className="mt-4 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/" ? pathname === "/" : pathname === item.href.split("#")[0];
              return <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><Icon size={19} />{item.label}</Link>;
            })}
          </div>

          <p className="mt-10 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Tools</p>
          <div className="mt-4 space-y-1">
            <Link href="/reviews" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"><ClipboardList size={19} /> Review records</Link>
            <Link href="/documents" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"><CheckSquare size={19} /> Documents</Link>
          </div>
        </nav>

        <div className="border-t border-slate-100 p-4"><div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 font-semibold uppercase text-indigo-700">{userRole.slice(0, 2)}</div><div><p className="text-sm font-semibold capitalize">{userRole}</p><p className="text-xs text-slate-500">ProjectTrack account</p></div></div></div>
      </aside>
    </>
  );
}
