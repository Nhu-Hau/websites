import { getBadges } from "@/lib/server/api";
import { BadgesClient } from "./BadgesClient";

export default async function BadgesServer() {
  const badges = await getBadges();
  
  return <BadgesClient initialBadges={badges} />;
}

