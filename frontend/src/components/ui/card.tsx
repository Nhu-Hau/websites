import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "stats" | "interactive" | "gradient";
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hover = false, ...props }, ref) => {
    const baseStyles =
      "rounded-2xl border shadow-sm transition-all duration-200";

    const variants = {
      default:
        "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50",
      stats: "border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl",
      interactive:
        "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 cursor-pointer",
      gradient:
        "border-zinc-200 dark:border-zinc-700 bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900",
    };

    const hoverStyles = hover
      ? "hover:shadow-lg hover:-translate-y-[2px] hover:ring-2 hover:ring-zinc-900/10 dark:hover:ring-white/10"
      : "";

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, className)}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export default Card;

