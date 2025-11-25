import { Suspense } from "react";
import { Calendar, AlarmClock } from "lucide-react";
import ActivityHeatmapServer from "./ActivityHeatmapServer";
import StudyScheduleServer from "./StudyScheduleServer";
import DashboardChartLoaderCard from "./DashboardChartLoaderCard";

function ActivityHeatmapLoader() {
  return (
    <DashboardChartLoaderCard
      accentClass="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800"
      title="Biểu đồ hoạt động học tập"
      subtitle="Theo dõi thói quen học theo từng ngày trong năm."
      badgeLabel="Hoạt động"
      heightClass="h-56 sm:h-64"
      icon={
        <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-200/60 via-blue-200/40 to-indigo-300/40 blur-xl" />
          <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md shadow-[#00000022] sm:h-10 sm:w-10">
            <Calendar className="h-5 w-5 text-white" />
          </div>
        </div>
      }
    />
  );
}

function StudyScheduleLoader() {
  return (
    <DashboardChartLoaderCard
      accentClass="bg-gradient-to-r from-[#3B8561] to-[#31694E]"
      title="Lên lịch học thông minh"
      subtitle="Hệ thống tự gợi ý và đồng bộ lịch nhắc."
      badgeLabel="Planner"
      heightClass="h-44 sm:h-48"
      icon={
        <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl sm:h-10 sm:w-10">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#3B8561]/60 via-[#31694E]/40 to-[#3B8561]/40 blur-xl" />
          <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B8561] to-[#31694E] shadow-md shadow-[#00000022] sm:h-10 sm:w-10">
            <AlarmClock className="h-5 w-5 text-white" />
          </div>
        </div>
      }
    />
  );
}

export default function ActivityTabContent() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<ActivityHeatmapLoader />}>
        <ActivityHeatmapServer />
      </Suspense>
      <Suspense fallback={<StudyScheduleLoader />}>
        <StudyScheduleServer />
      </Suspense>
    </div>
  );
}
