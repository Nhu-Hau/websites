import { redirect } from "next/navigation";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.practice.meta" });
  const path = locale === "vi" ? "/practice" : `/${locale}/practice`;

  return genMeta(
    {
      title: t("title"),
      description: t("description"),
      keywords: t("keywords").split(", "),
      canonical: generateCanonical(path, locale),
      ogType: "website",
    },
    locale
  );
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const target =
    locale === "vi"
      ? "/practice/part.1?level=1"
      : `/${locale}/practice/part.1?level=1`;
  redirect(target);
}
