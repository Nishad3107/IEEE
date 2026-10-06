import type { Metadata } from "next";
import "./globals.css";
import AppShell from "../components/AppShell";
import { AuthProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: "ProjectTrack Dashboard",
  description: "Final-year project tracking dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><AuthProvider><AppShell>{children}</AppShell></AuthProvider></body>
    </html>
  );
}
