import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectTrack Dashboard",
  description: "Final-year project tracking dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
