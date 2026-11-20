const MUHAMMAD = /^(muhammad|muhamad|muhammed|mohammad|mohamad|mohammed|mochammad|mochamad|muchammad|muchamad|moch|moh|mohd|muh)\.?$/i;

function kata(nama: string | null | undefined): string[] {
  return (nama ?? "").trim().split(/\s+/).filter(Boolean);
}

function kapital(w: string): string {
  if (/[.]./.test(w)) return w;
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

export function namaOrang(nama: string | null | undefined): string {
  const daftar = kata(nama);
  if (daftar.length === 0) return (nama ?? "").trim();
  return daftar.map((w) => (MUHAMMAD.test(w) ? "M." : kapital(w))).join(" ");
}

export function namaSiswa(nama: string | null | undefined): string {
  const daftar = kata(namaOrang(nama));
  if (daftar.length <= 2) return daftar.join(" ");
  const sisa = daftar.slice(2).map((w) => (w.endsWith(".") ? w : `${w.charAt(0).toUpperCase()}.`));
  return [...daftar.slice(0, 2), ...sisa].join(" ");
}

export function namaTampil(nama: string | null | undefined, role?: string | null): string {
  return role === "SISWA" ? namaSiswa(nama) : namaOrang(nama);
}

export function namaPanggilan(nama: string | null | undefined): string {
  const daftar = kata(nama);
  const pilih = (daftar.find((w) => !MUHAMMAD.test(w)) ?? daftar[0] ?? "").replace(/[^\p{L}]/gu, "");
  return pilih ? kapital(pilih) : "";
}
