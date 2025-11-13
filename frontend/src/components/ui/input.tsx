import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl border bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm",
            "text-zinc-900 dark:text-zinc-100",
            "placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "transition-all duration-200",
            error
              ? "border-red-500 focus:ring-red-500 dark:border-red-500"
              : "border-zinc-300 dark:border-zinc-700 focus:ring-sky-500 focus:border-sky-500",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            props.disabled &&
              "opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

