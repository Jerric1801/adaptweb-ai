import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import Dashboard from "./Dashboard";

export const metadata: Metadata = {
  title: "Dashboard — AdaptWeb AI",
  description: "Patterns removed, hidden costs surfaced and your reading mode, synced to the extension.",
};

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Dashboard />
      </main>
      <SiteFooter />
    </div>
  );
}
