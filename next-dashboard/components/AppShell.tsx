"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar, { UserRole } from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role: authRole } = useAuth();
  const [role, setRole] = useState<UserRole>(pathname.startsWith("/student") ? "student" : "coordinator");

  useEffect(() => {
    if (authRole) setRole(authRole);
  }, [authRole]);

  if (pathname === "/login") return <>{children}</>;

  return <><Sidebar userRole={role} /><div className="min-h-screen lg:pl-72">{children}</div></>;
}
