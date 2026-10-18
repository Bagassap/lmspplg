"use client";

import {
  createContext, useCallback, useContext, useEffect, useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, Info, X, Trash2, AlertOctagon,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useIsAppMode } from "@/lib/pwaInstall";
import { icon3dStyle, type Tone3D } from "@/components/shared/Icon3D";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
  createdAt: Date;
}

interface ConfirmItem {
  id: string;
  message: string;
  description?: string;
  confirmLabel?: string;
  resolve: (val: boolean) => void;
}

interface ToastContextValue {
  success: (title: string, description?: string, duration?: number) => void;
  error:   (title: string, description?: string, duration?: number) => void;
  warning: (title: string, description?: string, duration?: number) => void;
  info:    (title: string, description?: string, duration?: number) => void;
  dismiss: (id: string) => void;
  confirm: (message: string, description?: string, confirmLabel?: string) => Promise<boolean>;
}

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function FloatingDot({ color, x, y, delay, size }: { color: string; x: number; y: number; delay: number; size: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      style={{ width: size, height: size, background: color, left: "50%", top: "50%" }}
      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      animate={{ opacity: [0, 0.8, 0], x, y, scale: [0, 1, 0.4] }}
      transition={{ duration: 1.6, delay, ease: "easeOut" }}
    />
  );
}

const ToastCtx = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const TOAST_META: Record<ToastType, { icon: React.ElementType; tone: Tone3D }> = {
  success: { icon: CheckCircle2, tone: "emerald" },
  error:   { icon: XCircle, tone: "amber" },
  warning: { icon: AlertTriangle, tone: "sky" },
  info:    { icon: Info, tone: "violet" },
};

/** Toast sukses/gagal versi simpel: kotak di tengah layar berisi ikon 3D + keterangan, animasi pop sederhana. */
function NotificationCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const meta = TOAST_META[toast.type];
  const Icon = meta.icon;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), Math.min(toast.duration, 3500));
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.16 } }}
      transition={{ type: "spring", damping: 22, stiffness: 320 }}
      onClick={() => onDismiss(toast.id)}
      className="flex w-full max-w-xs select-none flex-col items-center rounded-3xl bg-white px-6 pb-6 pt-7 text-center shadow-[0_24px_60px_-16px_rgba(15,23,42,0.45)] dark:bg-[#1E293B]"
    >
      <motion.span
        initial={{ scale: 0.4 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 300, delay: 0.05 }}
        className="flex h-16 w-16 items-center justify-center rounded-[22px]"
        style={icon3dStyle(meta.tone)}
      >
        <Icon size={30} color="#fff" />
      </motion.span>
      <span className="mt-4 block text-base font-extrabold leading-snug text-slate-900 dark:text-white">{toast.title}</span>
      {toast.description && <span className="mt-1 block text-sm leading-snug text-slate-600 dark:text-slate-300">{toast.description}</span>}
    </motion.div>
  );
}

function ConfirmDialog({ item, onClose }: { item: ConfirmItem; onClose: (val: boolean) => void }) {
  const isDark = useDarkMode();
  const app = useIsAppMode();
  const tint = (a: number) => (app ? `rgba(62,3,179,${a})` : `rgba(242,106,61,${a})`);
  const accent = app ? "#3E03B3" : "#F26A3D";

  const cardBg     = isDark ? "#1E293B" : "#ffffff";
  const titleColor = isDark ? "#FFFFFF" : "#0F172A";
  const descColor  = isDark ? "#94a3b8" : "#64748b";
  const divider    = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const cancelBg   = isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF";
  const cancelText = isDark ? "#94a3b8" : "#64748b";
  const headerBg   = isDark ? "rgba(255,255,255,0.03)" : app ? "#F1EDFA" : "#F1EDFA";

  const dots = [
    { x: -50, y: -46, delay: 0.1,  size: 7 },
    { x:  52, y: -42, delay: 0.18, size: 5 },
    { x: -56, y:  14, delay: 0.25, size: 6 },
    { x:  54, y:  16, delay: 0.14, size: 4 },
    { x: -20, y:  54, delay: 0.30, size: 5 },
    { x:  24, y:  52, delay: 0.22, size: 7 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.80, y: 28, filter: "blur(6px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.88, y: 16, filter: "blur(4px)", transition: { duration: 0.22 } }}
      transition={{ type: "spring", damping: 18, stiffness: 260 }}
      className="relative w-full max-w-sm select-none"
    >
      <motion.div
        animate={{ opacity: [0.5, 0.16, 0.5], scale: [1, 1.06, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -inset-4 -z-10 rounded-4xl blur-2xl"
        style={{ background: tint(0.24) }}
      />

      <div
        className="relative overflow-hidden rounded-[1.75rem]"
        style={{
          background: cardBg,
          boxShadow: isDark
            ? "0 28px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)"
            : "0 28px 64px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="relative flex flex-col items-center overflow-hidden pb-6 pt-10"
          style={{ background: headerBg }}
        >
          <motion.div
            animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0.25, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ width: 160, height: 160, background: tint(0.22) }}
          />

          <div className="relative flex items-center justify-center">
            {dots.map((d, i) => (
              <FloatingDot key={i} color={accent} x={d.x} y={d.y} delay={d.delay} size={d.size} />
            ))}

            <motion.div
              animate={{ scale: [1, 1.55, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute rounded-full"
              style={{ width: 108, height: 108, background: tint(0.10) }}
            />
            <motion.div
              animate={{ scale: [1, 1.32, 1], opacity: [0.55, 0.1, 0.55] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="absolute rounded-full"
              style={{ width: 84, height: 84, background: tint(0.16) }}
            />

            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 13, stiffness: 260, delay: 0.1 }}
              className="relative z-10 flex h-17 w-17 items-center justify-center rounded-2xl text-white"
              style={{
                background: accent,
                boxShadow: `0 16px 40px ${tint(0.55)}`,
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 1.0, delay: 0.28, ease: "easeInOut" }}
                className="absolute inset-0 rounded-2xl bg-white"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 360, delay: 0.2 }}
              >
                <AlertOctagon size={32} strokeWidth={2} />
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="mt-5 rounded-lg px-3 py-1 text-[10px] font-black tracking-[0.16em] uppercase"
            style={{
              background: isDark ? "rgba(255,255,255,0.08)" : tint(0.10),
              color: app ? "#3E03B3" : "#3E03B3",
            }}
          >
            Konfirmasi
          </motion.div>
        </div>

        <div style={{ height: 1, background: divider }} />

        <div className="flex flex-col items-center px-6 pb-6 pt-5">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="text-center text-[16px] font-black leading-snug"
            style={{ color: titleColor }}
          >
            {item.message}
          </motion.p>

          {item.description && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="mt-2 text-center text-sm leading-relaxed"
              style={{ color: descColor }}
            >
              {item.description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="mt-5 flex w-full gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => onClose(false)}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${app ? "rounded-full" : "rounded-2xl"}`}
              style={{ background: cancelBg, color: cancelText }}
            >
              Batal
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: `0 10px 28px ${tint(0.50)}` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onClose(true)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold text-white ${app ? "rounded-full" : "rounded-2xl"}`}
              style={{
                background: accent,
                boxShadow: `0 6px 20px ${tint(0.40)}`,
              }}
            >
              <Trash2 size={14} />
              {item.confirmLabel ?? "Ya, Hapus"}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts,   setToasts]   = useState<ToastItem[]>([]);
  const [confirms, setConfirms] = useState<ConfirmItem[]>([]);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (type: ToastType, title: string, description?: string, duration = 3500) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts([{ id, type, title, description, duration, createdAt: new Date() }]);
    },
    [],
  );

  const confirm = useCallback(
    (message: string, description?: string, confirmLabel?: string): Promise<boolean> =>
      new Promise((resolve) => {
        const id = `confirm-${Date.now()}`;
        setConfirms((prev) => [...prev, { id, message, description, confirmLabel, resolve }]);
      }),
    [],
  );

  const closeConfirm = useCallback((id: string, val: boolean) => {
    setConfirms((prev) => {
      const item = prev.find((c) => c.id === id);
      item?.resolve(val);
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const ctx: ToastContextValue = {
    success: (t, d, dur) => add("success", t, d, dur),
    error:   (t, d, dur) => add("error",   t, d, dur),
    warning: (t, d, dur) => add("warning", t, d, dur),
    info:    (t, d, dur) => add("info",    t, d, dur),
    dismiss,
    confirm,
  };

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      {mounted && createPortal(
        <>
          <AnimatePresence>
            {toasts.length > 0 && (
              <motion.div
                key="toast-bd"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                data-plain className="fixed inset-0 z-9998 bg-black/30 backdrop-blur-[3px]"
                onClick={() => dismiss(toasts[0].id)}
              />
            )}
          </AnimatePresence>

          <div
            aria-live="polite"
            data-plain
            className="pointer-events-none fixed inset-0 z-9999 flex items-center justify-center p-4"
          >
            <AnimatePresence mode="wait">
              {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto flex w-full justify-center">
                  <NotificationCard toast={t} onDismiss={dismiss} />
                </div>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {confirms.length > 0 && (
              <motion.div
                key="confirm-bd"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                data-plain className="fixed inset-0 z-9996 bg-black/35 backdrop-blur-[3px]"
                onClick={() => closeConfirm(confirms[confirms.length - 1].id, false)}
              />
            )}
          </AnimatePresence>

          <div data-plain className="pointer-events-none fixed inset-0 z-9997 flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
              {confirms.slice(-1).map((item) => (
                <div key={item.id} className="pointer-events-auto w-full max-w-sm">
                  <ConfirmDialog item={item} onClose={(val) => closeConfirm(item.id, val)} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}
