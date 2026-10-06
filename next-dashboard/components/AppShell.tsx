"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar, { UserRole } from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>(pathname.startsWith("/student") ? "student" : "coordinator");

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        const storedRole = JSON.parse(stored).role?.toLowerCase();
        if (["student", "guide", "coordinator"].includes(storedRole)) setRole(storedRole as UserRole);
      } catch {
        // Ignore malformed local session data.
      }
    }
  }, []);

  if (pathname === "/login") return <>{children}</>;

  return <><Sidebar userRole={role} /><div className="min-h-screen lg:pl-72">{children}</div></>;
}
