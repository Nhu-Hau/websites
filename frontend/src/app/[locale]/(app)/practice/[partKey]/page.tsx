import dynamic from "next/dynamic";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";

// Dynamic import client component để tối ưu bundle size
const PracticePart = dynamic(() => import("@/components/features/test/PracticePart"));

const PART_META: Record<
  string,
  { title: string; description: string }
> = {
  "part.1": {
    title: "Part 1 – Photographs",
    description: "Luyện tập Part 1 TOEIC - Mô tả tranh. Luyện nghe và chọn câu mô tả đúng nhất cho bức tranh.",
  },
  "part.2": {
    title: "Part 2 – Question–Response",
    description: "Luyện tập Part 2 TOEIC - Hỏi đáp. Luyện nghe câu hỏi và chọn câu trả lời phù hợp nhất.",
  },
  "part.3": {
    title: "Part 3 – Conversations",
    description: "Luyện tập Part 3 TOEIC - Đoạn hội thoại. Luyện nghe các cuộc hội thoại ngắn và trả lời câu hỏi.",
  },
  "part.4": {
    title: "Part 4 – Talks",
    description: "Luyện tập Part 4 TOEIC - Bài nói ngắn. Luyện nghe các bài nói và trả lời câu hỏi liên quan.",
  },
  "part.5": {
    title: "Part 5 – Incomplete Sentences",
    description: "Luyện tập Part 5 TOEIC - Hoàn thành câu. Luyện ngữ pháp và từ vựng để hoàn thành câu đúng.",
  },
  "part.6": {
    title: "Part 6 – Text Completion",
    description: "Luyện tập Part 6 TOEIC - Hoàn thành đoạn văn. Luyện đọc và điền từ phù hợp vào chỗ trống.",
  },
  "part.7": {
    title: "Part 7 – Reading Comprehension",
    description: "Luyện tập Part 7 TOEIC - Đọc hiểu. Luyện đọc các đoạn văn dài và trả lời câu hỏi hiểu biết.",
  },
};

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string; partKey: string }> 
}) {
  const { locale, partKey } = await params;
  const partMeta = PART_META[partKey] || {
    title: `Practice ${partKey}`,
    description: "Luyện tập TOEIC với các câu hỏi thực tế.",
  };
  
  const path = locale === "vi" 
    ? `/practice/${partKey}` 
    : `/${locale}/practice/${partKey}`;
  
  return genMeta({
    title: partMeta.title,
    description: partMeta.description,
    keywords: [
      "TOEIC",
      `TOEIC ${partKey}`,
      "luyện thi TOEIC",
      "thi thử TOEIC",
      partMeta.title,
    ],
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default function Page() {
  return <PracticePart />;
}
