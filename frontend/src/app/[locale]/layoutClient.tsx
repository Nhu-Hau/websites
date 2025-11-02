"use client";

import { usePathname } from "next/navigation";
import ChatBox from "../../components/common/ChatBox";
import AdminChatBox from "../../components/common/AdminChatBox";
import Header from "../../components/common/Header";
import Footer from "@/components/common/Footer";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ẩn ChatBox + AdminChatBox + Footer ở các trang luyện test hoặc placement
  const hideAll =
    /^\/[a-z]{2}\/practice\/[^/]+\/\d+\/\d+$/.test(pathname) || // /vi/practice/part.1/1/2
    /^\/[a-z]{2}\/placement$/.test(pathname);                   // /vi/placement

  // chỉ ẩn Footer ở các trang kết quả hoặc lịch sử
  const hideFooterOnly =
    /^\/[a-z]{2}\/placement\/result\/[^/]+$/.test(pathname) ||  // /vi/placement/result/abc123
    /^\/[a-z]{2}\/practice\/history\/[^/]+$/.test(pathname);    // /vi/practice/history/abc123

  return (
    <>
      <Header />
      <main>{children}</main>

      {/* ẩn cả ChatBox + AdminChatBox + Footer nếu hideAll */}
      {!hideAll && (
        <>
          <ChatBox />
          <AdminChatBox />
          {!hideFooterOnly && <Footer />}
        </>
      )}
    </>
  );
}