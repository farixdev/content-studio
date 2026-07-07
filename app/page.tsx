import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(ROLE_HOME[user.role]);
}
