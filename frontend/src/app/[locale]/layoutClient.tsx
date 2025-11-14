"use client";

import { usePathname } from "next/navigation";
import ChatBox from "../../components/common/ChatBox";
import AdminChatBox from "../../components/common/AdminChatBox";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ẩn ChatBox + AdminChatBox + Footer ở các trang luyện test hoặc placement
  const hideAll =
    /^\/[a-z]{2}\/(practice|study)\/[^/]+(\/\d+\/\d+)?$/.test(pathname) || // /vi/practice/part.1/1/2
    /^\/[a-z]{2}\/placement$/.test(pathname) ||
    /^\/[a-z]{2}\/progress$/.test(pathname); // /vi/placement

  // chỉ ẩn Footer ở các trang kết quả hoặc lịch sử
  const hideFooterOnly =
    /^\/[a-z]{2}\/placement\/result\/[^/]+$/.test(pathname) || // /vi/placement/result/abc123
    /^\/[a-z]{2}\/practice\/history\/[^/]+$/.test(pathname) ||
    /^\/[a-z]{2}\/progress$/.test(pathname); // /vi/practice/history/abc123

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
