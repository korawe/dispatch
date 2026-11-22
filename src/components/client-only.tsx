"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const noopSubscribe = () => () => {};

/**
 * Renders its children only in the browser. Screens that read what's saved on the device use it, so the
 * server's render never disagrees with what the phone has stored.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const inBrowser = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return inBrowser ? children : fallback;
}
