import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — AdaptWeb AI",
  description: "Sign in with a 6-digit code emailed to you. No password.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-start justify-center px-4 py-14 sm:px-6 sm:py-24">
        <LoginForm />
      </main>
      <SiteFooter />
    </div>
  );
}
