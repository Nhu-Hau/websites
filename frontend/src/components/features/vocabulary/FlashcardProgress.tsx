 "use client";

 interface FlashcardProgressProps {
   current: number;
   total: number;
   progress: number;
   remembered: number;
   notYet: number;
 }

 export function FlashcardProgress({
   current,
   total,
   progress,
   remembered,
   notYet,
 }: FlashcardProgressProps) {
   const percent = Math.max(0, Math.min(100, Math.round(progress)));
   return (
     <div className="mx-auto mb-8 w-full max-w-3xl rounded-[32px] border border-zinc-200/80 bg-white/90 p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
       <div className="flex flex-wrap items-center justify-between gap-3">
         <div>
           <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-400">
             Tiến độ
           </p>
           <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
             {current} / {total}
           </p>
         </div>
         <span className="rounded-2xl border border-zinc-200/70 px-4 py-1.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-200">
           {percent}%
         </span>
       </div>
       <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/80">
         <div
           className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-400 transition-all"
           style={{ width: `${percent}%` }}
         />
       </div>
       <div className="mt-4 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
         <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-4 py-3 font-semibold text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
           {remembered} đã nhớ
         </div>
         <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 font-semibold text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
           {notYet} cần ôn
         </div>
       </div>
     </div>
   );
 }
// frontend/src/components/features/vocabulary/FlashcardProgress.tsx
