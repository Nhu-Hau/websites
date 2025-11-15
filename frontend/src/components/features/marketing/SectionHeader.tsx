import React from "react";

export default function SectionHeader({
  eyebrow,
  title,
  desc,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {eyebrow && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-50 dark:bg-sky-950/50 px-4 py-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            {eyebrow}
          </span>
        </div>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {desc && (
        <p
          className={`mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 ${
            align === "center" ? "mx-auto max-w-2xl" : "max-w-xl"
          }`}
        >
          {desc}
        </p>
      )}
    </div>
  );
}