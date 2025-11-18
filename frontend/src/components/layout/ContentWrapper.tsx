// components/layout/ContentWrapper.tsx
// Wrapper component cho phần content bên trong page với max-width và padding chuẩn

type ContentWrapperProps = {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "5xl" | "full";
};

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "5xl": "max-w-5xl",
  full: "max-w-full",
};

export default function ContentWrapper({
  children,
  className = "",
  maxWidth = "5xl",
}: ContentWrapperProps) {
  return (
    <main
      className={`mx-auto ${maxWidthClasses[maxWidth]} px-4 py-6 sm:py-8 ${className}`}
    >
      {children}
    </main>
  );
}

















