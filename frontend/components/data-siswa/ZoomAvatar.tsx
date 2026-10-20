"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { resolveMediaSrc } from "@/lib/media";

/** Avatar yang bisa diklik untuk melihat foto profil dalam ukuran besar (admin/guru). */
export function ZoomAvatar(props: React.ComponentProps<typeof Avatar>) {
  const [open, setOpen] = useState(false);
  const full = resolveMediaSrc(props.src);
  if (!full) return <Avatar {...props} />;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Lihat foto ${props.nama}`} className="block cursor-zoom-in rounded-full">
        <Avatar {...props} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div data-plain className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <button type="button" onClick={() => setOpen(false)} aria-label="Tutup"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#3E03B3]">
            <X size={20} />
          </button>
          <div className="flex max-h-full max-w-lg flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={full} alt={props.nama} className="max-h-[75dvh] w-auto max-w-full rounded-3xl bg-white object-contain shadow-2xl" />
            <p className="text-center text-base font-bold text-white">{props.nama}</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
