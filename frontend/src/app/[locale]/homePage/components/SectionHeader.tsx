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
    <div className={align === "center" ? "text-center" : ""}>
      <span className="text-xs font-semibold uppercase tracking-widest text-sky-600">
        {eyebrow}
      </span>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-zinc-100">
        {title}
      </h2>
      {desc && (
        <p
          className={`mt-3 max-w-2xl text-sm leading-6 text-slate-400 ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {desc}
        </p>
      )}
    </div>
  );
}
