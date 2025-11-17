import NavMenu from "@/components/navigation/NavMenu";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

export default function MobileNav({ open, menuRef }: MobileNavProps) {
  return (
    <div
      ref={menuRef}
      aria-label={open ? "Đóng menu" : "Mở menu"}
      className={cn(
        "lg:hidden overflow-hidden",
        "transition-all duration-300 ease-out",
        open
          ? "max-h-[32rem] opacity-100"
          : "max-h-0 opacity-0 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "mx-2 xs:mx-3 my-2 rounded-2xl",
          "border border-zinc-200/70 dark:border-zinc-700/60",
          "bg-white/80 dark:bg-zinc-900/80",
          "backdrop-blur-xl shadow-lg",
          "px-4 py-3 xs:px-5 xs:py-4"
        )}
      >
        <NavMenu />
      </div>
    </div>
  );
}