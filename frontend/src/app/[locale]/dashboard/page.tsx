import React from "react";
import Dashboard from "@/components/dashboard/Dashboard";

type Props = {
  params: { locale: string };
};

export default async function DashboardPage({ params }: Props) {
  return <Dashboard locale={params.locale} />;
}