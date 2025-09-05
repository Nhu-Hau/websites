import Link from "next/link";

const codeBgColorPalette = [
  "bg-[#faae2b]",
  "bg-[#078080]",
  "bg-[#2c81c2]",
  "bg-[#f45d48]",
  "bg-cyan-300",
];

type Props = {
  part: { id: string; title: string; name: string; questionCount: number };
  href: string;
  colorClass: string;
  index: number;
};

export default function PracticeCard({
  part,
  href,
  colorClass,
  index,
}: Props) {
  const codeBgColor = codeBgColorPalette[index % codeBgColorPalette.length];

  return (
    <div className="group relative transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01]">
      <Link href={href}>
        <div className="relative p-6 bg-white/80 backdrop-blur-md border border-zinc-400/50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}
          />
          <h3
            className={`relative text-2xl font-bold text-white ${codeBgColor} transition-colors duration-300 font-sans tracking-tight leading-tight border-b border-zinc-200/50 pb-2 mb-3 px-3 py-1 rounded-t-md`}
          >
            {part.title}
          </h3>
          <p className="relative text-lg text-zinc-900 font-medium">
            {part.name}
          </p>
          <p className="relative mt-2 text-sm text-zinc-600 font-medium">
            {part.questionCount} Questions
          </p>
          <span className="absolute bottom-3 right-3 text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors duration-300">
            Start Now →
          </span>
        </div>
      </Link>
    </div>
  );
}