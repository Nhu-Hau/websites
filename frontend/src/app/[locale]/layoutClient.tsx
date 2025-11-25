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
import CommunityChipNav from "@/components/navigation/CommunityChipNav";
import DashboardChipNav from "@/components/navigation/DashboardChipNav";
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

  const normalizedPath = pathname?.split("?")[0] || "";
  // Check if it's a study room page: /[locale]/study/[room] but not /[locale]/study/create
  // Match pattern: /[locale]/study/[room-name] where room-name is not "create"
  const studyRoomPattern = /\/study\/([^/]+)/;
  const studyMatch = normalizedPath.match(studyRoomPattern);
  const isStudyRoom =
    !!studyMatch &&
    studyMatch[1] !== "create" &&
    !normalizedPath.includes("/study/create");

  // ẩn Chat + Footer ở các trang luyện test hoặc placement
  // Exclude study room pages from hideAll (they are handled separately)
  // Support both /placement and /en/placement patterns
  const hideAll =
    /^(\/[a-z]{2})?\/practice\/[^/]+(\/\d+\/\d+)?$/.test(pathname) || // /practice/part.1/1/2 or /vi/practice/part.1/1/2
    /^(\/[a-z]{2})?\/placement$/.test(pathname) || // /placement or /vi/placement
    /^(\/[a-z]{2})?\/progress$/.test(pathname); // /progress or /vi/progress

  // chỉ ẩn Footer ở các trang kết quả hoặc lịch sử
  const hideFooterOnly =
    /^(\/[a-z]{2})?\/placement\/result\/[^/]+$/.test(pathname) || // /placement/result/abc123 or /vi/placement/result/abc123
    /^(\/[a-z]{2})?\/practice\/history\/[^/]+$/.test(pathname) || // /practice/history/abc123 or /vi/practice/history/abc123
    /^(\/[a-z]{2})?\/progress\/result\/[^/]+$/.test(pathname); // /progress/result/abc123 or /vi/progress/result/abc123

  // Show SideNav only on community pages (desktop only)
  // Explicitly hide on study room pages
  const showSideNav =
    !isStudyRoom &&
    (pathname?.includes("/community") || pathname?.includes("/study/create")) &&
    !isMobile;

  // Hide Footer on community and study pages
  const hideFooterOnCommunity =
    (pathname?.includes("/community") || pathname?.includes("/study")) &&
    !isStudyRoom;

  // Show chip navigation on screens <lg for community and dashboard
  // Include community-related routes: /community, /study/create, /account
  // Note: lg:hidden class in HorizontalChipNav will handle the responsive display
  const showCommunityChips =
    !isStudyRoom &&
    (pathname?.includes("/community") ||
      pathname?.includes("/study/create") ||
      pathname?.includes("/account"));
  const showDashboardChips =
    pathname?.includes("/dashboard") || pathname?.includes("/mobile/dashboard");

  // Show bottom bar on all pages, but hide it when ChatSheet is open on mobile
  // (ChatPanel on desktop doesn't cover BottomTabBar, so we only hide on mobile)
  const shouldShowBottomBar = !isStudyRoom;
  const shouldHideBottomBarForChat = isChatOpen && isMobile;

  // Hide Chat FAB on community pages and study pages
  const isCommunityPage = pathname?.includes("/community") || false;
  const isStudyPage = pathname?.includes("/study") || false;
  const shouldHideChatFAB = hideAll || isCommunityPage || isStudyPage;

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

      {/* Mobile Chip Navigation */}
      {showCommunityChips && <CommunityChipNav />}
      {showDashboardChips && <DashboardChipNav />}

      {showSideNav ? (
        <div className="flex min-h-screen">
          <SideNav />
          <div className="flex-1 lg:ml-0">
            <main className="min-h-screen w-full">{children}</main>
          </div>
        </div>
      ) : (
        <main className="min-h-screen w-full">{children}</main>
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
      {/* Hide on study room pages, community pages, study pages, and other test/placement pages */}
      {!shouldHideChatFAB && (
        <>
          <ChatFAB />
          <ChatPanel />
          <ChatSheet />
        </>
      )}

      {/* Footer */}
      {!hideAll &&
        !hideFooterOnly &&
        !hideFooterOnCommunity &&
        !isStudyRoom && <Footer />}
    </SnackbarProvider>
  );
}
