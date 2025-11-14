import { getDashboardActivity } from "@/lib/server/api";
import ActivityHeatmapClient from "./ActivityHeatmapClient";

export default async function ActivityHeatmapServer() {
  const activityData = await getDashboardActivity();
  
  return <ActivityHeatmapClient initialData={activityData} />;
}

