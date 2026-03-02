import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/ui/top-nav";
import { ClientBootstrap } from "@/components/ui/client-bootstrap";

export const metadata: Metadata = {
  title: "Jadwal Pelajaran",
  description: "Sistem penyusunan jadwal pelajaran berbasis Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientBootstrap />
        <div className="app-shell">
          <header className="app-header">
            <div>
              <h1>Jadwal Pelajaran</h1>
              <p>Weekly planner dengan validasi konflik realtime.</p>
            </div>
          </header>
          <TopNav />
          <main className="page-container">{children}</main>
        </div>
      </body>
    </html>
  );
}
