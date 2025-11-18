"use client";

import { usePathname } from "next/navigation";
import { SnackbarProvider } from "notistack";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import SideNav from "@/components/layout/SideNav";
import BottomTabBar from "@/components/layout/BottomTabBar";
import MobileAvatarSheet from "@/components/layout/MobileAvatarSheet";
import ChatFAB from "@/components/layout/ChatFAB";
import ChatPanel from "@/components/layout/ChatPanel";
import ChatSheet from "@/components/layout/ChatSheet";
import { useMobileAvatarSheet } from "@/context/MobileAvatarSheetContext";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useIsMobile } from "@/hooks/common/useIsMobile";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { open, setOpen, user, me } = useMobileAvatarSheet();
  const { user: ctxUser } = useAuth();
  const { open: isChatOpen } = useChat();
  const isMobile = useIsMobile();

  // ẩn Chat + Footer ở các trang luyện test hoặc placement
  const hideAll =
    /^\/[a-z]{2}\/(practice|study)\/[^/]+(\/\d+\/\d+)?$/.test(pathname) || // /vi/practice/part.1/1/2
    /^\/[a-z]{2}\/placement$/.test(pathname) ||
    /^\/[a-z]{2}\/progress$/.test(pathname); // /vi/placement

  // chỉ ẩn Footer ở các trang kết quả hoặc lịch sử
  const hideFooterOnly =
    /^\/[a-z]{2}\/placement\/result\/[^/]+$/.test(pathname) || // /vi/placement/result/abc123
    /^\/[a-z]{2}\/practice\/history\/[^/]+$/.test(pathname) ||
    /^\/[a-z]{2}\/progress$/.test(pathname); // /vi/practice/history/abc123

  // Show SideNav only on community pages
  const showSideNav = pathname?.includes("/community") || pathname?.includes("/study");
  
  // Hide Footer on community and study pages
  const hideFooterOnCommunity = pathname?.includes("/community") || pathname?.includes("/study");

  // Show bottom bar on all pages, but hide it when ChatSheet is open on mobile
  // (ChatPanel on desktop doesn't cover BottomTabBar, so we only hide on mobile)
  const shouldShowBottomBar = true;
  const shouldHideBottomBarForChat = isChatOpen && isMobile;

  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      autoHideDuration={3000}
      preventDuplicate
    >
      {/* Always show Header */}
      <Header />
      
      {showSideNav ? (
        <div className="flex min-h-screen">
          <SideNav />
          <div className="flex-1 lg:ml-0">
            <main className={`min-h-screen ${shouldShowBottomBar ? "pb-16" : ""}`}>{children}</main>
          </div>
        </div>
      ) : (
        <main className={shouldShowBottomBar ? "pb-16" : ""}>{children}</main>
      )}

      {/* Bottom Tab Bar - Hide when ChatSheet is open on mobile */}
      {shouldShowBottomBar && !shouldHideBottomBarForChat && <BottomTabBar />}

      {/* Mobile Avatar Sheet - Render ở cấp cao để tránh container có transform/overflow */}
      <MobileAvatarSheet
        open={open}
        onClose={() => setOpen(false)}
        user={user || ctxUser}
        me={me}
      />

      {/* Chat System - Unified FAB + Panel/Sheet */}
      {!hideAll && (
        <>
          <ChatFAB />
          <ChatPanel />
          <ChatSheet />
        </>
      )}

      {/* Footer */}
      {!hideAll && !hideFooterOnly && !hideFooterOnCommunity && <Footer />}
    </SnackbarProvider>
  );
}
