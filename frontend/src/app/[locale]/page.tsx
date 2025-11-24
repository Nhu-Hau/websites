import React from "react";
import dynamic from "next/dynamic";
import { Hero } from "@/components/features/marketing";
import { GoogleAuthEffect } from "@/components/features/auth/GoogleAuthEffect";
import { generateMetadata as genMeta, generateCanonical, SITE_CONFIG } from "@/lib/seo";
import { generateWebSiteSchema, generateFAQPageSchema, renderJsonLd } from "@/lib/seo/structured-data";
import { PageMotion } from "@/components/layout/PageMotion";
import { getTranslations } from "next-intl/server";

const SectionSkeleton = ({ label }: { label: string }) => (
  <section className="mx-auto my-10 w-full max-w-6xl animate-pulse rounded-3xl border border-slate-200/70 bg-white/60 p-6 text-sm text-slate-400 dark:border-zinc-800/70 dark:bg-zinc-900/50 dark:text-zinc-500">
    {label}
  </section>
);

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage.meta" });
  const path = locale === "vi" ? "" : `/${locale}`;
  
  return genMeta({
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(", "),
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default async function HomePage({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{ locale: string }>;
}) {
  const sp = await searchParams;
  const { locale } = await params;
  const auth = typeof sp.auth === "string" ? sp.auth : undefined;
  const t = await getTranslations({ locale, namespace: "HomePage" });

  const WorkflowSection = dynamic(() => import("@/components/features/marketing/WorkflowSection"), {
    loading: () => <SectionSkeleton label={t("loading", { label: t("labels.workflow") })} />,
  });
  const Testimonials = dynamic(() => import("@/components/features/marketing/Testimonials"), {
    loading: () => <SectionSkeleton label={t("loading", { label: t("labels.testimonials") })} />,
  });
  const Pricing = dynamic(() => import("@/components/features/marketing/Pricing"), {
    loading: () => <SectionSkeleton label={t("loading", { label: t("labels.pricing") })} />,
  });
  const FAQSection = dynamic(() => import("@/components/features/marketing/FAQSection"), {
    loading: () => <SectionSkeleton label={t("loading", { label: t("labels.faq") })} />,
  });
  const FinalCTA = dynamic(() => import("@/components/features/marketing/FinalCTA"), {
    loading: () => <SectionSkeleton label={t("loading", { label: t("labels.cta") })} />,
  });

  const websiteSchema = generateWebSiteSchema(SITE_CONFIG.url);
  const faqSchema = generateFAQPageSchema([
    {
      question: t("jsonLd.faq.0.question"),
      answer: t("jsonLd.faq.0.answer"),
    },
    {
      question: t("jsonLd.faq.1.question"),
      answer: t("jsonLd.faq.1.answer"),
    },
    {
      question: t("jsonLd.faq.2.question"),
      answer: t("jsonLd.faq.2.answer"),
    },
  ]);

  return (
    <>
      {renderJsonLd(websiteSchema)}
      {renderJsonLd(faqSchema)}
      <PageMotion className="min-h-screen bg-white dark:bg-zinc-950 antialiased">
        <GoogleAuthEffect auth={auth} />
        <Hero />
        <WorkflowSection />
        <Testimonials />
        <Pricing />
        <FAQSection />
        <FinalCTA />
      </PageMotion>
    </>
  );
}