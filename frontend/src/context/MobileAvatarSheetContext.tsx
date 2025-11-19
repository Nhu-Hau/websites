"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface MobileAvatarSheetContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: any;
  setUser: (user: any) => void;
  me: any;
  setMe: (me: any) => void;
}

const MobileAvatarSheetContext = createContext<
  MobileAvatarSheetContextType | undefined
>(undefined);

export function MobileAvatarSheetProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [me, setMe] = useState<any>(null);

  return (
    <MobileAvatarSheetContext.Provider
      value={{ open, setOpen, user, setUser, me, setMe }}
    >
      {children}
    </MobileAvatarSheetContext.Provider>
  );
}

export function useMobileAvatarSheet() {
  const context = useContext(MobileAvatarSheetContext);
  if (context === undefined) {
    throw new Error(
      "useMobileAvatarSheet must be used within MobileAvatarSheetProvider"
    );
  }
  return context;
}



