// Phase 1 keeps everything on the device (decision 34). These wrap the browser's storage so a blocked or
// full store never breaks the app; it just won't remember.
//
// Every save also announces itself, so screens can show the latest data. That matters because Next.js keeps
// recently visited screens alive in the background (Cache Components' Activity): a screen that read the
// delegates list once would otherwise keep showing that old copy when you come back to it.

const CHANGE_EVENT = "dispatch-local-change";

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: it just won't be remembered */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function removeLocal(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Calls back whenever anything is saved on the device, here or in another tab. For useSyncExternalStore. */
export function subscribeLocal(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
