// "use client";

// import { useParams, notFound, useRouter } from "next/navigation";
// import Breadcrumb from "@/components/common/Breadcrumb";
// import AllTestPageLayout from "@/components/layout/AllTestPage";
// import { getTestById, getAllParts } from "@/lib";
// import Link from "next/link";
// import { useMemo, useState } from "react";

// type Params = { locale: string; testId: string };
// type ViewMode = "info" | "answers";

// type Part = {
//   id: string | number;
//   title: string;
//   name?: string;
//   questionCount: number;
// };

// type GroupKey = "Listening" | "Reading";

// export default function TestOverviewPage() {
//   const { locale, testId } = useParams<Params>();
//   const router = useRouter();

//   const test = getTestById(testId);
//   if (!test) notFound();

//   const parts = useMemo<Part[]>(() => getAllParts(), []);

//   // Helpers
//   const toStr = (v: unknown) => String(v ?? "");
//   const getPartNumber = (id: unknown, idx: number) => {
//     const s = toStr(id);
//     const m = s.match(/\d+/);
//     return m ? parseInt(m[0], 10) : idx + 1;
//   };
//   const getPartBadge = (id: unknown, idx: number) =>
//     String(getPartNumber(id, idx));
//   const getGroup = (id: unknown, idx: number): GroupKey =>
//     getPartNumber(id, idx) <= 4 ? "Listening" : "Reading";

//   const [mode, setMode] = useState<ViewMode>("info");

//   // Checkbox state (mặc định KHÔNG chọn)
//   const initialChecked = useMemo(
//     () =>
//       Object.fromEntries(parts.map((p) => [toStr(p.id), false])) as Record<
//         string,
//         boolean
//       >,
//     [parts]
//   );
//   const [checked, setChecked] =
//     useState<Record<string, boolean>>(initialChecked);

//   const toggleAll = (value: boolean) => {
//     setChecked((prev) => {
//       const next = { ...prev };
//       parts.forEach((p) => (next[toStr(p.id)] = value));
//       return next;
//     });
//   };
//   const toggleOne = (id: string) =>
//     setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

//   // Nhóm động
//   const grouped = useMemo(() => {
//     const groups: Record<GroupKey, Part[]> = { Listening: [], Reading: [] };
//     parts.forEach((p, i) => groups[getGroup(p.id, i)].push(p));
//     return groups;
//   }, [parts]);

//   const selectedIds = parts
//     .filter((p) => checked[toStr(p.id)])
//     .map((p) => toStr(p.id));
//   const selectedCount = selectedIds.length;

//   // Điều hướng khi bấm "Bắt đầu"
//   const handleStart = () => {
//     if (mode !== "info" || selectedCount === 0) return;
//     if (selectedCount === 1) {
//       const pid = selectedIds[0];
//       router.push(`/${locale}/practice/tests/${test.id}/${pid}`);
//     } else {
//       router.push(
//         `/${locale}/practice/tests/${test.id}?parts=${encodeURIComponent(
//           selectedIds.join(",")
//         )}`
//       );
//     }
//   };

//   return (
//     <AllTestPageLayout>
//       <Breadcrumb
//         items={[
//           { href: `/${locale}/homePage`, label: "Trang chủ" },
//           { href: `/${locale}/practice/tests`, label: "Luyện đề" },
//           { label: test.title, active: true },
//         ]}
//       />

//       {/* Header */}
//       <header className="mb-6 sm:mb-8">
//         <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
//           {test.title}
//         </h1>
//         <p className="mt-2 text-md text-zinc-600 dark:text-zinc-400">
//           {test.totalQuestions} câu - {test.durationMin} phút
//         </p>
//       </header>

//       {/* Main */}
//       <div className="mx-auto w-full max-w-3xl">
//         {/* Toggle + Start (không chứa Đã chọn/Chọn tất cả) */}
//         <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div
//             className="inline-flex rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
//             role="tablist"
//             aria-label="Chế độ hiển thị"
//           >
//             <div className="flex gap-2 items-center">
//               <button
//                 type="button"
//                 onClick={() => setMode("info")}
//                 className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
//                   mode === "info"
//                     ? "bg-[#272343] text-white dark:bg-zinc-100 dark:text-zinc-900"
//                     : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700/50"
//                 }`}
//                 aria-pressed={mode === "info"}
//               >
//                 Thông tin đề
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setMode("answers")}
//                 className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
//                   mode === "answers"
//                     ? "bg-[#272343] text-white dark:bg-zinc-100 dark:text-zinc-900"
//                     : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700/50"
//                 }`}
//                 aria-pressed={mode === "answers"}
//               >
//                 Đáp án
//               </button>
//             </div>
//           </div>

//           {mode === "info" && (
//             <div className="flex items-center gap-4 text-sm">
//               <button
//                 type="button"
//                 onClick={handleStart}
//                 disabled={selectedCount === 0}
//                 className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium transition-colors duration-200 ${
//                   selectedCount === 0
//                     ? "bg-zinc-300 text-zinc-600 cursor-not-allowed"
//                     : "bg-[#272343] text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
//                 }`}
//                 title={
//                   selectedCount === 0 ? "Hãy chọn ít nhất 1 part" : "Bắt đầu"
//                 }
//               >
//                 Bắt đầu
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Danh sách theo nhóm */}
//         {(["Listening", "Reading"] as GroupKey[]).map((group) => {
//           const items = grouped[group];
//           if (!items.length) return null;

//           return (
//             <section key={group} className="mb-8">
//               <header className="flex items-center justify-between px-4 py-3">
//                 <h2
//                   className={`text-xl font-semibold text-zinc-900 dark:text-zinc-100 uppercase`}
//                 >
//                   {group}
//                 </h2>

//                 {/* Chỉ Listening hiển thị Đã chọn/Chọn tất cả */}
//                 {group === "Listening" && mode === "info" && (
//                   <div className="flex gap-3 text-sm">
//                     <span className="text-zinc-600 cursor-default">
//                       Đã chọn <b>{selectedCount}</b>/{parts.length} part
//                     </span>
//                     <label className="inline-flex items-center gap-2">
//                       <input
//                         type="checkbox"
//                         className="h-4 w-4 accent-[#272343] dark:accent-zinc-100 rounded cursor-pointer"
//                         checked={
//                           selectedCount === parts.length && parts.length > 0
//                         }
//                         onChange={(e) => toggleAll(e.target.checked)}
//                         aria-label="Chọn tất cả part"
//                       />
//                       <span className="text-zinc-700">Chọn tất cả</span>
//                     </label>
//                   </div>
//                 )}
//               </header>

//               <div className="border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
//                 <ul
//                   role="list"
//                   className="divide-y divide-zinc-200 dark:divide-zinc-700"
//                 >
//                   {items.map((p) => {
//                     const globalIdx = parts.findIndex(
//                       (pp) => toStr(pp.id) === toStr(p.id)
//                     );
//                     const badge = getPartBadge(p.id, globalIdx);
//                     const pid = toStr(p.id);
//                     const partHref = `/${locale}/practice/tests/${test.id}/${pid}`;
//                     const answerHref = `/${locale}/practice/tests/${test.id}/${pid}/answers`;

//                     return (
//                       <li
//                         key={pid}
//                         className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/20 transition-colors duration-150"
//                       >
//                         {/* Left: Badge + Title + Name -> click để vào trang part */}
//                         <div className="min-w-0 flex items-center gap-3 rounded-lg cursor-default">
//                           <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-sm font-semibold text-zinc-700 dark:border-zinc-600 dark:text-zinc-200 group-hover:underline">
//                             {badge}
//                           </span>
//                           <div>
//                             <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
//                               {p.title}
//                             </h3>
//                             {p.name && (
//                               <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
//                                 {p.name}
//                               </p>
//                             )}
//                           </div>
//                         </div>

//                         {/* Right: Actions */}
//                         <div className="flex items-center justify-between gap-4 sm:justify-end">
//                           {mode === "info" ? (
//                             <>
//                               <p className="text-md text-zinc-600 dark:text-zinc-400 cursor-default">
//                                 {p.questionCount} câu
//                               </p>
//                               <label
//                                 className="inline-flex items-center gap-2 cursor-pointer"
//                                 onClick={(e) => e.stopPropagation()}
//                               >
//                                 <input
//                                   type="checkbox"
//                                   className="h-4 w-4 accent-[#272343] dark:accent-zinc-100 rounded cursor-pointer"
//                                   checked={!!checked[pid]}
//                                   onChange={() => toggleOne(pid)}
//                                   aria-label={`Chọn ${p.title}`}
//                                 />
//                               </label>
//                             </>
//                           ) : (
//                             <Link
//                               href={answerHref}
//                               className="text-sm font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors duration-150"
//                               aria-label={`Xem đáp án ${p.title}`}
//                               prefetch
//                             >
//                               Xem đáp án
//                             </Link>
//                           )}
//                         </div>
//                       </li>
//                     );
//                   })}
//                 </ul>
//               </div>
//             </section>
//           );
//         })}
//       </div>
//     </AllTestPageLayout>
//   );
// }
