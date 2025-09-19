// "use client";

// import { useParams, notFound } from "next/navigation";
// import Breadcrumb from "@/components/common/Breadcrumb";
// import AllTestPageLayout from "@/components/layout/AllTestPage";
// import { motion } from "framer-motion";
// import { useMemo } from "react";
// import {
//   getPartMeta,
//   getTestsForPart,
//   getTestAccess,
//   TOTAL_DURATION_MIN,
// } from "@/lib"; // re-export từ lib/index

// type UrlParams = { locale: string; partId: string };

// export default function PartListingPage() {
//   const { locale, partId } = useParams<UrlParams>();

//   // parse & validate partId (1..7)
//   const pid = useMemo(() => {
//     const n = Number(partId);
//     return Number.isInteger(n) && n >= 1 && n <= 7
//       ? (n as 1 | 2 | 3 | 4 | 5 | 6 | 7)
//       : null;
//   }, [partId]);

//   if (!pid) {
//     notFound(); // 404 nếu partId không hợp lệ
//   }

//   const part = getPartMeta(pid);
//   const tests = getTestsForPart(pid); // hiện tại trả 10 test (mock)

//   return (
//     <AllTestPageLayout>
//       <Breadcrumb
//         items={[
//           { href: `/${locale}/homePage`, label: "Home" },
//           { href: `/${locale}/practice/parts`, label: "All Parts" },
//           { label: `${part.title}`, active: true },
//         ]}
//       />

//       <header className="mb-8">
//         <h1 className="text-3xl font-bold tracking-tight">
//           {part.title}: {part.name}
//         </h1>
//         <p className="mt-2 text-zinc-600">
//           {part.section} • {part.questionCount} câu
//         </p>
//       </header>

//       <section aria-labelledby="tests-heading" className="mb-12">
//         <h2 id="tests-heading" className="sr-only">
//           Danh sách đề cho {part.title}
//         </h2>

//         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {tests.map((t, index) => {
//             const access = getTestAccess(t.id);
//             // Link đích: tùy routing của bạn. Ví dụ:
//             // /[locale]/practice/tests/[testId]/parts/[partId]
//             const href = `/${locale}/practice/tests/${t.id}/parts/${pid}`;

//             return (
//               <motion.a
//                 key={t.id}
//                 href={href}
//                 whileHover={{ y: -4, scale: 1.01 }}
//                 whileTap={{ scale: 0.99 }}
//                 transition={{ type: "spring", stiffness: 320, damping: 18 }}
//                 className="group block rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-md p-5 shadow hover:shadow-lg"
//               >
//                 <div className="flex items-start justify-between">
//                   <h3 className="text-xl font-semibold">{t.title}</h3>
//                   <span
//                     className={`text-xs px-2 py-1 rounded ${
//                       access === "free"
//                         ? "bg-emerald-100 text-emerald-700"
//                         : "bg-amber-100 text-amber-700"
//                     }`}
//                   >
//                     {access}
//                   </span>
//                 </div>

//                 <p className="mt-2 text-sm text-zinc-600">
//                   {part.title} • {part.name}
//                 </p>
//                 <p className="mt-1 text-sm text-zinc-600">
//                   {part.questionCount} câu
//                 </p>

//                 <div className="mt-4 text-sm text-zinc-500 group-hover:text-zinc-700">
//                   Bắt đầu {part.title} →
//                 </div>
//               </motion.a>
//             );
//           })}
//         </div>
//       </section>
//     </AllTestPageLayout>
//   );
// }
