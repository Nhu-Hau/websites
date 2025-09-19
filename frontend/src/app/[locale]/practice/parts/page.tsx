// "use client";

// import { useParams } from "next/navigation";
// import Breadcrumb from "@/components/common/Breadcrumb";
// import { getListeningParts, getReadingParts } from "@/lib";
// import { useState, useEffect } from "react";
// import AllTestPageLayout from "@/components/layout/AllTestPage";
// import PracticeSection from "@/components/cards/PracticeSection";

// export default function AllPartsPage() {
//   const { locale } = useParams<{ locale: string }>();
//   const [isMounted, setIsMounted] = useState(false);

//   useEffect(() => {
//     setIsMounted(true);
//   }, []);

//   const listeningParts = getListeningParts();
//   const readingParts = getReadingParts();

//   return (
//     <AllTestPageLayout>
//       <Breadcrumb
//         items={[
//           { href: `/${locale}/homePage`, label: "Home" },
//           { label: "All Parts", active: true },
//         ]}
//       />

//       {/* Listening Section */}
//       <PracticeSection
//         title="Listening"
//         parts={listeningParts}
//         colorClass="text-black"
//         sectionId="listening-heading"
//       />

//       {/* Reading Section */}
//       <PracticeSection
//         title="Reading"
//         parts={readingParts}
//         colorClass="text-black"
//         sectionId="reading-heading"
//       />
//     </AllTestPageLayout>
//   );
// }
