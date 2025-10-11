import CheckoutClient from "./CheckoutClient";

export default function Page({
  params,
}: {
  params: { locale: string };
}) {
  return <CheckoutClient locale={params.locale} />;
}