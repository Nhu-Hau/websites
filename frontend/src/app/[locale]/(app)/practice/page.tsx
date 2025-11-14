import { redirect } from "next/navigation";

// Redirect to part.1 by default
export default function PracticePage() {
  redirect("/vi/practice/part.1?level=1");
}
