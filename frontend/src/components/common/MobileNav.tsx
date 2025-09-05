import NavMenu from "@/components/navigation/navbar/NavMenu";

interface MobileNavProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

export default function MobileNav({ open, menuRef }: MobileNavProps) {
  return (
    <div
      ref={menuRef}
      aria-label={open ? "Close menu" : "Open menu"}
      className={`lg:hidden overflow-hidden transition-[max-height] duration-300 ease-out ${
        open ? "max-h-[26rem]" : "max-h-0"
      }`}
    >
      <div className="px-4 pb-4 pt-2 sm:px-6">
        <NavMenu />
      </div>
    </div>
  );
}
