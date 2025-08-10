import "../globals.css";
import Header from "../components/common/header";
import Footer from "../components/common/Footer";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "../../routing";
import { cookies } from "next/headers";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const theme = (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang={locale}
      className={theme === "dark" ? "dark" : ""}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider locale={locale}>
          <Header />
          <main className="">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
