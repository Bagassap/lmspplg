import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppMenuPage } from "@/components/app/AppMenuPage";

export default async function MenuPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppMenuPage user={user} />;
}
