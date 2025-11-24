import { redirect } from "next/navigation";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = locale === "vi" ? "/practice" : `/${locale}/practice`;

  return genMeta(
    {
      title: "Luyện đề TOEIC theo Part & Level",
      description:
        "Truy cập ngay thư viện đề luyện TOEIC được chia theo Part và Level. Bắt đầu với Part 1 và nâng cấp dần để cải thiện điểm Listening & Reading.",
      keywords: ["TOEIC practice", "luyện đề TOEIC", "TOEIC part 1", "ôn luyện TOEIC"],
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
