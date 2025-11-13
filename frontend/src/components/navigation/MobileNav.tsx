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
      aria-label={open ? "Đóng menu" : "Mở menu"}
      className={`lg:hidden overflow-hidden transition-[max-height] duration-300 ease-out
                  ${open ? "max-h-[30rem]" : "max-h-0"}`}
    >
      <div className="px-3 xs:px-4 pb-3 xs:pb-4 pt-1.5 xs:pt-2">
        <NavMenu />
      </div>
    </div>
  );
}