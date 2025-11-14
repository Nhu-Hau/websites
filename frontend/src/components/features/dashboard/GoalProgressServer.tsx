import { getDashboardGoal } from "@/lib/server/api";
import GoalProgressClient from "./GoalProgressClient";

export default async function GoalProgressServer() {
  const goalData = await getDashboardGoal();
  
  return <GoalProgressClient initialData={goalData} />;
}

