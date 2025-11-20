"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

type ChatTab = "admin" | "ai";

interface ChatContextType {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  activeTab: ChatTab;
  setActiveTab: Dispatch<SetStateAction<ChatTab>>;
  unreadCount: { admin: number; ai: number };
  setUnreadCount: Dispatch<SetStateAction<{ admin: number; ai: number }>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>("admin");
  const [unreadCount, setUnreadCount] = useState({ admin: 0, ai: 0 });

  return (
    <ChatContext.Provider
      value={{
        open,
        setOpen,
        activeTab,
        setActiveTab,
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}








