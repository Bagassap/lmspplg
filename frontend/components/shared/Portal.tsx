"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const kosong = () => () => {};

export function Portal({ children }: { children: ReactNode }) {
  const klien = useSyncExternalStore(kosong, () => true, () => false);
  return klien ? createPortal(children, document.body) : null;
}
