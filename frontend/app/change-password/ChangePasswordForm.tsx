"use client";

import { useState, type FormEvent } from "react";
import { motion, type Variants } from "framer-motion";
import { Eye, EyeOff, Loader2, KeyRound, Sparkles } from "lucide-react";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

type Field = "newPassword" | "confirmPassword";

const FIELDS: { key: Field; label: string; placeholder: string; autoComplete: string; icon: typeof KeyRound }[] = [
  { key: "newPassword", label: "Password Baru", placeholder: "Minimal 8 karakter", autoComplete: "new-password", icon: KeyRound },
  { key: "confirmPassword", label: "Konfirmasi Password Baru", placeholder: "Ulangi password baru", autoComplete: "new-password", icon: KeyRound },
];

export function ChangePasswordForm() {
  const [values, setValues] = useState<Record<Field, string>>({
    newPassword: "",
    confirmPassword: "",
  });
  const [visible, setVisible] = useState<Record<Field, boolean>>({
    newPassword: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: Field, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }
  function toggleVisible(key: Field) {
    setVisible((v) => ({ ...v, [key]: !v[key] }));
  }

  function validate(): string | null {
    if (!values.newPassword || !values.confirmPassword) {
      return "Semua field wajib diisi.";
    }
    if (values.newPassword.length < 8) {
      return "Password baru minimal 8 karakter.";
    }
    if (values.newPassword !== values.confirmPassword) {
      return "Konfirmasi password baru tidak cocok.";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Gagal mengubah password.");
        setLoading(false);
        return;
      }

      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const me = await meRes.json().catch(() => null);
      const role = (me?.role as string)?.toLowerCase() ?? "siswa";
      window.location.replace(`/${role}/dashboard`);
    } catch {
      setError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      variants={container}
      className="mt-8 flex flex-col gap-5"
    >
      <motion.div
        variants={item}
        className="flex items-start gap-2.5 rounded-xl border border-blue/15 bg-blue/5 px-3.5 py-3"
      >
        <Sparkles size={16} className="mt-0.5 shrink-0 text-blue" />
        <p className="text-xs leading-relaxed text-black/65">
          Selamat datang! Untuk keamanan akun Anda, silakan buat password baru.
          Password default Anda adalah NIS Anda.
        </p>
      </motion.div>

      {FIELDS.map(({ key, label, placeholder, autoComplete, icon: Icon }) => (
        <motion.div key={key} variants={item} className="flex flex-col gap-1.5">
          <label htmlFor={key} className="text-sm font-medium text-black/70">
            {label}
          </label>
          <div className="relative">
            <Icon
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/35"
            />
            <input
              id={key}
              name={key}
              type={visible[key] ? "text" : "password"}
              autoComplete={autoComplete}
              required
              value={values[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-black/10 bg-black/3 px-4 py-3 pl-11 pr-11 text-sm text-black placeholder:text-black/35 outline-none transition-all focus:border-blue focus:bg-white focus:ring-2 focus:ring-blue/15"
            />
            <button
              type="button"
              onClick={() => toggleVisible(key)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/35 transition-colors hover:text-black/60"
              aria-label={visible[key] ? "Sembunyikan password" : "Tampilkan password"}
            >
              {visible[key] ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </motion.div>
      ))}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border-l-4 border-l-pink bg-[#050020] px-3 py-2 text-sm font-medium text-white"
        >
          {error}
        </motion.p>
      )}

      <motion.button
        variants={item}
        type="submit"
        disabled={loading}
        whileHover={!loading ? { scale: 1.02 } : undefined}
        whileTap={!loading ? { scale: 0.98 } : undefined}
        className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(0,51,255,0.55)] transition-all hover:shadow-[0_14px_40px_-8px_rgba(0,51,255,0.70)] hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-70"
        style={{ background: "linear-gradient(to right, #977DFF, #0033FF)" }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Memproses...
          </>
        ) : (
          "Simpan Password Baru"
        )}
      </motion.button>
    </motion.form>
  );
}
