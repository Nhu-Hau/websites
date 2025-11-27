// components/layout/PageWrapper.tsx
// Wrapper component chung cho các page để đảm bảo styling đồng nhất

type PageWrapperProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "light" | "gradient";
};

const variantClasses = {
  default:
    "min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 transition-colors duration-300",
  light:
    "min-h-screen w-full bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 transition-colors duration-300",
  gradient:
    "min-h-screen w-full bg-gradient-to-b from-sky-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 transition-colors duration-300",
};

export default function PageWrapper({
  children,
  className = "",
  variant = "default",
}: PageWrapperProps) {
  return (
    <div className={`${variantClasses[variant]} ${className}`}>{children}</div>
  );
}
