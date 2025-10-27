import React from "react";
import {
  Hero,
  Features,
  Testimonials,
  Pricing,
  FinalCTA,
} from "@/app/[locale]/homePage/components";
import { GoogleAuthEffect } from "@/components/auth/GoogleAuthEffect";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams; 
  const auth = typeof sp.auth === "string" ? sp.auth : undefined;

  return (
    <main className="min-h-screen bg-white antialiased">
      <GoogleAuthEffect auth={auth} />
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <FinalCTA />
    </main>
  );
}
