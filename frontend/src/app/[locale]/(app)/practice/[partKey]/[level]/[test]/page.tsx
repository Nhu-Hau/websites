import dynamic from "next/dynamic";
import { PageMotion } from "@/components/layout/PageMotion";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";

// Dynamic import client component nặng để tối ưu bundle size
const PracticePage = dynamic(() => import("@/components/features/practice"));

const PART_META: Record<
  string,
  { title: string; description: string }
> = {
  "part.1": {
    title: "Part 1 – Photographs",
    description: "Luyện tập Part 1 TOEIC - Mô tả tranh",
  },
  "part.2": {
    title: "Part 2 – Question–Response",
    description: "Luyện tập Part 2 TOEIC - Hỏi đáp",
  },
  "part.3": {
    title: "Part 3 – Conversations",
    description: "Luyện tập Part 3 TOEIC - Đoạn hội thoại",
  },
  "part.4": {
    title: "Part 4 – Talks",
    description: "Luyện tập Part 4 TOEIC - Bài nói ngắn",
  },
  "part.5": {
    title: "Part 5 – Incomplete Sentences",
    description: "Luyện tập Part 5 TOEIC - Hoàn thành câu",
  },
  "part.6": {
    title: "Part 6 – Text Completion",
    description: "Luyện tập Part 6 TOEIC - Hoàn thành đoạn văn",
  },
  "part.7": {
    title: "Part 7 – Reading Comprehension",
    description: "Luyện tập Part 7 TOEIC - Đọc hiểu",
  },
};

const LEVEL_LABELS: Record<string, string> = {
  "1": "Beginner",
  "2": "Intermediate",
  "3": "Advanced",
};

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string; partKey: string; level: string; test: string }> 
}) {
  const { locale, partKey, level, test } = await params;
  const partMeta = PART_META[partKey] || {
    title: `Practice ${partKey}`,
    description: "Luyện tập TOEIC",
  };
  const levelLabel = LEVEL_LABELS[level] || `Level ${level}`;
  
  const path = locale === "vi" 
    ? `/practice/${partKey}/${level}/${test}` 
    : `/${locale}/practice/${partKey}/${level}/${test}`;
  
  return genMeta({
    title: `${partMeta.title} - ${levelLabel} - Test ${test}`,
    description: `${partMeta.description} - ${levelLabel} level. Làm bài test ${test} để cải thiện kỹ năng TOEIC của bạn.`,
    keywords: [
      "TOEIC",
      `TOEIC ${partKey}`,
      `TOEIC Level ${level}`,
      "luyện thi TOEIC",
      "thi thử TOEIC",
      partMeta.title,
      levelLabel,
    ],
    canonical: generateCanonical(path, locale),
    ogType: "website",
    noindex: true, // Practice test pages should not be indexed
  }, locale);
}

export default function Page() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      <PageMotion>
        <PracticePage />
      </PageMotion>
    </div>
  );
}
