import dynamic from "next/dynamic";

// Dynamic import client component để tối ưu bundle size
const PracticePart = dynamic(() => import("@/components/features/test/PracticePart"));

export default function Page() {
  return <PracticePart />;
}
