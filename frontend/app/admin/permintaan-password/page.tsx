import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SUPER_ADMIN_LOGIN_ID } from "@/lib/constants";
import PermintaanPasswordClient from "./PermintaanPasswordClient";

export default async function PermintaanPasswordPage() {
  const user = await getCurrentUser();
  if (!user || user.loginId !== SUPER_ADMIN_LOGIN_ID) {
    redirect("/admin/dashboard");
  }

  return <PermintaanPasswordClient />;
}
