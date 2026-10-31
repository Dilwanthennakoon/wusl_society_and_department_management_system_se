import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/appshell";

export const metadata: Metadata = {
  title: "University Management System",
  description: "University Society and Department Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
