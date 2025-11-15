import React from "react";
import {
  Hero,
  Features,
  WorkflowSection,
  Testimonials,
  Pricing,
  FAQSection,
  FinalCTA,
} from "@/components/features/marketing";
import { GoogleAuthEffect } from "@/components/features/auth/GoogleAuthEffect";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams; 
  const auth = typeof sp.auth === "string" ? sp.auth : undefined;

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 antialiased">
      <GoogleAuthEffect auth={auth} />
      <Hero />
      <Features />
      <WorkflowSection />
      <Testimonials />
      <Pricing />
      <FAQSection />
      <FinalCTA />
    </main>
  );
}