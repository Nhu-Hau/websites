import { useParams } from "next/navigation";
import PracticeCard from "@/components/cards/PracticeCard";

type Props = {
  title: string;
  parts: { id: string; title: string; name: string; questionCount: number }[];
  colorClass: string;
  sectionId: string;
};

export default function PracticeSection({
  title,
  parts,
  colorClass,
  sectionId,
}: Props) {
  const { locale } = useParams<{ locale: string }>();

  return (
    <section
      className="mb-16 opacity-100 translate-y-0 transition-all duration-700"
      aria-labelledby={sectionId}
    >
      <h2
        id={sectionId}
        className={`mb-8 text-3xl font-bold ${colorClass} tracking-tight font-sans uppercase`}
      >
        {title}
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {parts.map((part, index) => (
          <div key={part.id}>
            <PracticeCard
              part={part}
              href={`/${locale}/practice/parts/${part.id}`}
              colorClass={colorClass}
              index={index}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
