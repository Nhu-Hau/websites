"use client";

import { Eye, EyeOff } from "lucide-react";
import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  show: boolean;
  onToggle: () => void;
};

export default function PasswordField({ id, label, show, onToggle, ...rest }: Props) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 pr-10 outline-none
                     focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10
                     text-base sm:text-sm text-zinc-900 dark:text-zinc-100
                     placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          {...rest}
        />
        <button
          type="button"
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          onClick={onToggle}
          className="absolute inset-y-0 right-2 grid place-items-center px-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
