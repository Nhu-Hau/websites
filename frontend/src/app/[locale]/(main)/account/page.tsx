import dynamic from "next/dynamic";
import PageWrapper from "@/components/layout/PageWrapper";

// Dynamic import client component để tối ưu bundle size
const Account = dynamic(() => import("@/components/features/auth/Account"));

export default function Page() {
  return (
    <PageWrapper>
      <Account />
    </PageWrapper>
  );
}
