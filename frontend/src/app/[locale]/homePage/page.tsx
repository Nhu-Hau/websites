import React from "react";
import {
  Hero,
  Features,
  HowItWorks,
  Categories,
  Testimonials,
  Pricing,
  FinalCTA,
} from "@/app/[locale]/homePage/components";
import { GoogleAuthEffect } from "@/components/auth/GoogleAuthEffect";

export default function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const auth =
    typeof searchParams.auth === "string" ? searchParams.auth : undefined;

  return (
    <main className="min-h-screen bg-white antialiased">
      <GoogleAuthEffect auth={auth} />
      <Hero />
      <Features />
      <HowItWorks />
      <Categories />
      <Testimonials />
      <Pricing />
      <FinalCTA />
    </main>
  );
}
