import { getStudyScheduleUpcoming } from "@/lib/server/api";
import { StudyScheduleClient } from "./StudyScheduleClient";

export default async function StudyScheduleServer() {
  const upcoming = await getStudyScheduleUpcoming();
  
  return <StudyScheduleClient initialUpcoming={upcoming} />;
}

