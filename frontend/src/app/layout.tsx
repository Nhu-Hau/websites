/* eslint-disable @typescript-eslint/ban-ts-comment */
// src/app/layout.tsx
// @ts-ignore
import "./globals.css";
import "@livekit/components-styles";
export const metadata = {
  title: "TOEIC PREP",
  description:
    "Luyện thi TOEIC trực tuyến, thi thử đề thật, chấm điểm nhanh, giải thích chi tiết.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
