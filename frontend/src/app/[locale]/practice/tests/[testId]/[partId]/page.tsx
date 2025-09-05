// "use client";

// import { useParams, notFound } from "next/navigation";
// import Breadcrumb from "@/components/common/Breadcrumb";
// import AllTestPageLayout from "@/components/layout/AllTestPage";
// import { useMemo } from "react";
// import { motion } from "framer-motion";

// import { getTestById, getPartMeta } from "@/lib";
// import { getItemsByTestAndPart } from "@/lib";
// import type { PartId } from "@/app/types/testTypes";
// import type {
//   Item,
//   P1Item,
//   P2Item,
//   P3Item,
//   P4Item,
//   P5Item,
//   P6Item,
//   P7Item,
//   QA,
// } from "@/app/types/testItemTypes";

// /* ------------------------ type guards ------------------------ */
// const isP1 = (it: Item): it is P1Item => it.part === 1;
// const isP2 = (it: Item): it is P2Item => it.part === 2;
// const isP3 = (it: Item): it is P3Item => it.part === 3;
// const isP4 = (it: Item): it is P4Item => it.part === 4;
// const isP5 = (it: Item): it is P5Item => it.part === 5;
// const isP6 = (it: Item): it is P6Item => it.part === 6;
// const isP7 = (it: Item): it is P7Item => it.part === 7;

// /* --------------------------- renderers --------------------------- */
// function RenderP1({ items }: { items: P1Item[] }) {
//   return (
//     <div className="space-y-6">
//       {items.map((it) => (
//         <motion.div
//           key={it.id}
//           whileHover={{ y: -2 }}
//           className="rounded-2xl border border-zinc-200 bg-white p-4 shadow"
//         >
//           <div className="flex gap-4">
//             {it.imageUrl && (
//               <img
//                 src={it.imageUrl}
//                 alt={it.id}
//                 className="h-28 w-40 object-cover rounded-md border"
//               />
//             )}
//             <div className="flex-1">
//               <ol className="list-[A_] space-y-1 pl-5">
//                 {it.statements.map((c) => (
//                   <li key={c.key} className="text-sm text-zinc-800">
//                     <label className="inline-flex items-center gap-2 cursor-pointer">
//                       <input type="radio" name={it.id} value={c.key} />
//                       <span>{c.text}</span>
//                     </label>
//                   </li>
//                 ))}
//               </ol>
//             </div>
//           </div>
//         </motion.div>
//       ))}
//     </div>
//   );
// }

// function RenderP2({ items }: { items: P2Item[] }) {
//   return (
//     <div className="space-y-6">
//       {items.map((it) => (
//         <div
//           key={it.id}
//           className="rounded-2xl border border-zinc-200 bg-white p-4 shadow"
//         >
//           <audio controls src={it.audioUrl} className="w-full mb-3" />
//           <ol className="list-[A_] space-y-1 pl-5">
//             {it.choices.map((c) => (
//               <li key={c.key} className="text-sm text-zinc-800">
//                 <label className="inline-flex items-center gap-2 cursor-pointer">
//                   <input type="radio" name={it.id} value={c.key} />
//                   <span>{c.text ?? `(Audio ${c.key})`}</span>
//                   {c.audioUrl && (
//                     <audio controls src={c.audioUrl} className="h-8" />
//                   )}
//                 </label>
//               </li>
//             ))}
//           </ol>
//         </div>
//       ))}
//     </div>
//   );
// }

// function QAList({ qas, name }: { qas: QA[]; name: string }) {
//   return (
//     <div className="space-y-3">
//       {qas.map((q) => (
//         <div key={q.id} className="rounded-lg border p-3">
//           <p className="font-medium mb-2">{q.question}</p>
//           <ol className="list-[A_] space-y-1 pl-5">
//             {q.choices.map((c) => (
//               <li key={c.key} className="text-sm text-zinc-800">
//                 <label className="inline-flex items-center gap-2 cursor-pointer">
//                   <input type="radio" name={`${name}-${q.id}`} value={c.key} />
//                   <span>{c.text}</span>
//                 </label>
//               </li>
//             ))}
//           </ol>
//         </div>
//       ))}
//     </div>
//   );
// }

// function RenderP3({ items }: { items: P3Item[] }) {
//   return (
//     <div className="space-y-6">
//       {items.map((it) => (
//         <div
//           key={it.id}
//           className="rounded-2xl border border-zinc-200 bg-white p-4 shadow"
//         >
//           <audio controls src={it.audioUrl} className="w-full mb-3" />
//           <QAList qas={it.qas} name={it.id} />
//         </div>
//       ))}
//     </div>
//   );
// }

// function RenderP4({ items }: { items: P4Item[] }) {
//   return (
//     <div className="space-y-6">
//       {items.map((it) => (
//         <div
//           key={it.id}
//           className="rounded-2xl border border-zinc-200 bg-white p-4 shadow"
//         >
//           <audio controls src={it.audioUrl} className="w-full mb-3" />
//           <QAList qas={it.qas} name={it.id} />
//         </div>
//       ))}
//     </div>
//   );
// }

// function RenderP5({ items }: { items: P5Item[] }) {
//   return (
//     <div className="space-y-6">
//       {items.map((it) => (
//         <div
//           key={it.id}
//           className="rounded-2xl border border-zinc-200 bg-white p-4 shadow"
//         >
//           <p className="mb-3">{it.sentence}</p>
//           <ol className="list-[A_] space-y-1 pl-5">
//             {it.choices.map((c) => (
//               <li key={c.key}>
//                 <label className="inline-flex items-center gap-2 cursor-pointer">
//                   <input type="radio" name={it.id} value={c.key} />
//                   <span>{c.text}</span>
//                 </label>
//               </li>
//             ))}
//           </ol>
//         </div>
//       ))}
//     </div>
//   );
// }

// function RenderP6({ items }: { items: P6Item[] }) {
//   const renderPassage = (text: string) =>
//     text.split(/\[\[(B\d+)\]\]/g).map((chunk, i) =>
//       /^B\d+$/.test(chunk) ? (
//         <span
//           key={i}
//           className="mx-1 inline-block rounded bg-zinc-100 px-2 py-0.5 text-sm text-zinc-700"
//         >
//           {chunk}
//         </span>
//       ) : (
//         <span key={i}>{chunk}</span>
//       )
//     );

//   return (
//     <div className="space-y-6">
//       {items.map((it) => (
//         <div
//           key={it.id}
//           className="rounded-2xl border border-zinc-200 bg-white p-4 shadow"
//         >
//           <div className="prose prose-zinc max-w-none mb-4">
//             {renderPassage(it.passage)}
//           </div>
//           <div className="grid gap-3 sm:grid-cols-2">
//             {it.blanks.map((b) => (
//               <div key={b.id} className="rounded-lg border p-3">
//                 <p className="text-sm font-medium mb-2">{b.id}</p>
//                 <ol className="list-[A_] space-y-1 pl-5">
//                   {b.choices.map((c) => (
//                     <li key={c.key}>
//                       <label className="inline-flex items-center gap-2 cursor-pointer">
//                         <input
//                           type="radio"
//                           name={`${it.id}-${b.id}`}
//                           value={c.key}
//                         />
//                         <span>{c.text}</span>
//                       </label>
//                     </li>
//                   ))}
//                 </ol>
//               </div>
//             ))}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// function RenderP7({ items }: { items: P7Item[] }) {
//   return (
//     <div className="space-y-8">
//       {items.map((it) => (
//         <div
//           key={it.id}
//           className="rounded-2xl border border-zinc-200 bg-white p-4 shadow"
//         >
//           <div className="grid gap-4 md:grid-cols-3">
//             <div className="md:col-span-1 space-y-3">
//               {it.passages.map((p) => (
//                 <div
//                   key={p.id}
//                   className="rounded-lg border p-3 prose prose-zinc max-w-none"
//                   dangerouslySetInnerHTML={{ __html: p.html }}
//                 />
//               ))}
//             </div>
//             <div className="md:col-span-2">
//               <QAList qas={it.qas} name={it.id} />
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// /* ------------------------------- PAGE ------------------------------- */
// type Params = { locale: string; testId: string; partId: string };

// export default function TestPartPage() {
//   const { locale, testId, partId } = useParams<Params>();

//   const pid = useMemo<PartId | null>(() => {
//     const n = Number(partId);
//     return Number.isInteger(n) && n >= 1 && n <= 7 ? (n as PartId) : null;
//   }, [partId]);

//   if (!pid) notFound();

//   const test = getTestById(testId);
//   if (!test) notFound();

//   const meta = getPartMeta(pid);
//   const items = getItemsByTestAndPart(testId, pid);

//   return (
//     <AllTestPageLayout>
//       <Breadcrumb
//         items={[
//           { href: `/${locale}/homePage`, label: "Trang chủ" },
//           { href: `/${locale}/practice/tests`, label: "Luyện đề" },
//           { href: `/${locale}/practice/tests/${testId}`, label: test.title },
//           { label: meta.title, active: true },
//         ]}
//       />

//       <header className="mb-8">
//         <h1 className="text-3xl font-bold tracking-tight">
//           {test.title} - {meta.title}: {meta.name}
//         </h1>
//         <p className="mt-2 text-zinc-600">
//           {meta.section} - {meta.questionCount} câu
//         </p>
//       </header>

//       {pid === 1 && <RenderP1 items={items.filter(isP1)} />}
//       {pid === 2 && <RenderP2 items={items.filter(isP2)} />}
//       {pid === 3 && <RenderP3 items={items.filter(isP3)} />}
//       {pid === 4 && <RenderP4 items={items.filter(isP4)} />}
//       {pid === 5 && <RenderP5 items={items.filter(isP5)} />}
//       {pid === 6 && <RenderP6 items={items.filter(isP6)} />}
//       {pid === 7 && <RenderP7 items={items.filter(isP7)} />}

//       {items.length === 0 && (
//         <p className="text-zinc-500">
//           Chưa có dữ liệu cho {test.title} • {meta.title}.
//         </p>
//       )}
//     </AllTestPageLayout>
//   );
// }
