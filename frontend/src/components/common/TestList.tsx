// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import { useEffect, useState } from "react";
// import Breadcrumb from "@/components/common/Breadcrumb";
// import AllTestPageLayout from "@/components/layout/AllTestPage";
// import TestCard from "@/components/cards/TestCard";

// type Mode = "practice" | "exam";
// type Difficulty = "beginner" | "intermediate" | "advanced";

// type ToeicTest = {
//   _id: string;
//   title: string;
//   access: "free" | "pro";
//   difficulty: Difficulty;
//   durationMin: number;
//   totalQuestions: number;
//   published: boolean;
// };

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

// export default function TestList({
//   mode,
//   locale,
// }: {
//   mode: Mode;
//   locale: string;
// }) {
//   const [tests, setTests] = useState<ToeicTest[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState<string | null>(null);

//   const [difficultyFilter, setDifficultyFilter] =
//     useState<Difficulty>("beginner");

//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await fetch(`${API_BASE}/api/tests?published=true`, {
//           cache: "no-store",
//         });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const json = await res.json();
//         const data: ToeicTest[] = json.data ?? [];

//         const collator = new Intl.Collator(undefined, {
//           numeric: true,
//           sensitivity: "base",
//         });
//         const sorted = [...data].sort((a, b) =>
//           collator.compare(a.title, b.title)
//         );

//         setTests(sorted);
//       } catch (e: any) {
//         setErr(e?.message || "Fetch error");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const heading = mode === "exam" ? "THI THỬ TOEIC" : "LUYỆN ĐỀ TOEIC";
//   const subheading =
//     mode === "exam" ? "Danh sách thi thử" : "Danh sách luyện tập";
//   const crumbLabel = mode === "exam" ? "Thi thử" : "Luyện đề";

//   const filtered = tests.filter((t) => t.difficulty === difficultyFilter);

//   return (
//     <AllTestPageLayout>
//       <div className="mx-auto w-full max-w-7xl">
//         <Breadcrumb
//           items={[
//             { href: `/${locale}/homePage`, label: "Trang chủ" },
//             { label: crumbLabel, active: true },
//           ]}
//         />

//         <header className="mb-6 flex flex-col gap-3 sm:mb-8 md:flex-row md:items-center md:justify-between">
//           <div>
//             <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl lg:text-4xl dark:text-zinc-100">
//               {heading}
//             </h1>
//             <p className="mt-1 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
//               {subheading}
//             </p>
//           </div>

//           <div
//             role="group"
//             aria-label="Lọc độ khó"
//             className="inline-flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800 max-w-fit w-full"
//           >
//             {(["beginner", "intermediate", "advanced"] as Difficulty[]).map(
//               (opt) => {
//                 const active = difficultyFilter === opt;
//                 const labelMap: Record<Difficulty, string> = {
//                   beginner: "Beginner",
//                   intermediate: "Intermediate",
//                   advanced: "Advanced",
//                 };
//                 return (
//                   <button
//                     key={opt}
//                     type="button"
//                     onClick={() => setDifficultyFilter(opt)}
//                     className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
//                       active
//                         ? "bg-[#272343] dark:bg-sky-800 text-white" // Nút active giữ nguyên vì đã đủ nổi bật
//                         : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
//                     }`}
//                     aria-pressed={active}
//                   >
//                     {labelMap[opt]}
//                   </button>
//                 );
//               }
//             )}
//           </div>
//         </header>

//         <section aria-labelledby="tests-heading">
//           <h2 id="tests-heading" className="sr-only">
//             Danh sách đề
//           </h2>

//           {loading && (
//             <div
//               className="
//                 grid gap-4 sm:gap-6
//                 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]
//                 md:[grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]
//                 xl:[grid-template-columns:repeat(4,minmax(0,1fr))]
//               "
//             >
//               {Array.from({ length: 6 }).map((_, i) => (
//                 <div
//                   key={i}
//                   className="h-36 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
//                 />
//               ))}
//             </div>
//           )}

//           {err && !loading && (
//             <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
//               Lỗi tải dữ liệu: {err}
//             </div>
//           )}

//           {!loading && !err && (
//             <>
//               <div
//                 id={`panel-${mode}`}
//                 role="tabpanel"
//                 aria-labelledby={mode === "exam" ? "Thi thử" : "Luyện đề"}
//                 className="
//                   grid gap-4 sm:gap-6
//                   [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]
//                   md:[grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]
//                   xl:[grid-template-columns:repeat(4,minmax(0,1fr))]
//                 "
//               >
//                 {filtered.map((t) => {
//                   const href =
//                     mode === "practice"
//                       ? `/${locale}/practice/tests/${t._id}`
//                       : `/${locale}/exam/tests/${t._id}`;

//                   return (
//                     <div
//                       key={t._id}
//                       className="transition-all duration-500 hover:translate-y-[-2px] hover:scale-[1.01]"
//                     >
//                       <TestCard
//                         title={t.title}
//                         access={t.access ?? "free"}
//                         totalQuestions={t.totalQuestions}
//                         durationMin={t.durationMin}
//                         difficulty={t.difficulty}
//                         href={href}
//                         cta={
//                           mode === "practice"
//                             ? "Xem 7 Part"
//                             : "Vào chế độ Thi thử"
//                         }
//                       />
//                     </div>
//                   );
//                 })}
//               </div>

//               {filtered.length === 0 && (
//                 <div className="mt-10 rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
//                   <p className="text-zinc-700 dark:text-zinc-300">
//                     Không có đề phù hợp bộ lọc.
//                   </p>
//                   <p className="text-sm text-zinc-500 dark:text-zinc-400">
//                     Hãy thử chọn độ khó khác.
//                   </p>
//                 </div>
//               )}
//             </>
//           )}
//         </section>
//       </div>
//     </AllTestPageLayout>
//   );
// }