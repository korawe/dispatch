// Settings saved on the device (decision 34). More arrive in later phases (§7, §11).
import { readLocal, writeLocal } from "./local.ts";

export type Settings = {
  /** Decision 32. On: Dispatch reads its questions aloud and you tap once per answer. Off: questions on screen. */
  speakPrompts: boolean;
};

const SETTINGS_KEY = "dispatch-settings-v1";

export const loadSettings = (): Settings => ({ speakPrompts: false, ...readLocal<Partial<Settings>>(SETTINGS_KEY, {}) });
export const saveSettings = (settings: Settings) => writeLocal(SETTINGS_KEY, settings);
