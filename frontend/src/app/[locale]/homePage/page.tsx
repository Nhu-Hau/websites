import React from "react";
import { Hero, Features, HowItWorks, Categories, Testimonials, Pricing, FinalCTA } from "@/app/[locale]/homePage/components";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white antialiased">
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