import { Suspense } from "react";
import { Trophy } from "lucide-react";
import BadgesServer from "./BadgesServer";
import DashboardChartLoaderCard from "./DashboardChartLoaderCard";

function BadgesLoader() {
  return (
    <DashboardChartLoaderCard
      accentClass="bg-gradient-to-r from-[#4063bb] to-[#35519a]"
      title="Bộ sưu tập huy hiệu"
      subtitle="Đếm huy hiệu đã mở khóa và chờ đồng bộ dữ liệu mới nhất."
      badgeLabel="Badges"
      heightClass="h-48 sm:h-52"
      icon={
        <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4063bb]/60 via-[#35519a]/40 to-[#4063bb]/40 blur-xl" />
          <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4063bb] to-[#35519a] shadow-md shadow-[#00000022] sm:h-10 sm:w-10">
            <Trophy className="h-5 w-5 text-white" />
          </div>
        </div>
      }
    />
  );
}

export default function BadgesTabContent() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<BadgesLoader />}>
        <BadgesServer />
      </Suspense>
    </div>
  );
}

