import React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full resize-none rounded-xl border bg-white dark:bg-zinc-800 px-4 py-3 text-sm",
          "text-zinc-900 dark:text-zinc-100",
          "placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
          "focus:outline-none focus:ring-2 focus:border-transparent",
          "transition-all duration-200",
          error
            ? "border-red-500 focus:ring-red-500 dark:border-red-500"
            : "border-zinc-300 dark:border-zinc-700 focus:ring-sky-500 focus:border-sky-500 dark:focus:border-sky-400",
          props.disabled &&
            "opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;

