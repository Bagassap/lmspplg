import { redirect } from "next/navigation";

export default function LupaPasswordPage() {
  redirect(
    "https://wa.me/6285640168132?text=" +
      encodeURIComponent("Halo Mr. Admin, saya lupa password akun LMS PPLG. Mohon bantuannya untuk mereset password saya. Nama: ... NIS: ..."),
  );
}
