import dynamic from "next/dynamic";
import PageWrapper from "@/components/layout/PageWrapper";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

// Dynamic import client component để tối ưu bundle size
const Account = dynamic(() => import("@/components/features/auth/Account"));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/account" : `/${locale}/account`;
  
  return genMeta({
    title: locale === "vi" ? "Tài khoản - TOEIC PREP" : "Account - TOEIC PREP",
    description: locale === "vi"
      ? "Quản lý tài khoản, cài đặt và thông tin cá nhân của bạn trên TOEIC PREP."
      : "Manage your account, settings and personal information on TOEIC PREP.",
    keywords: ["TOEIC", "account", "settings", "profile", "TOEIC PREP"],
    canonical: generateCanonical(path, locale),
    ogType: "website",
    noindex: true, // User account pages should not be indexed
  }, locale);
}

export default function Page() {
  return (
    <PageWrapper>
      <Account />
    </PageWrapper>
  );
}
