import PaymentSuccess from "@/components/features/payment/PaymentSuccess";
import { generateMetadata as genMeta, generateCanonical } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.payment.success.meta" });
  const path = locale === "vi" ? "/payment/success" : `/${locale}/payment/success`;
  
  return genMeta({
    title: t("title"),
    description: t("description"),
    canonical: generateCanonical(path, locale),
    ogType: "website",
  }, locale);
}

export default PaymentSuccess;