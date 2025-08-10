// src/app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "TOEIC PREP",
  description:
    "Luyện thi TOEIC trực tuyến, thi thử đề thật, chấm điểm nhanh, giải thích chi tiết.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
