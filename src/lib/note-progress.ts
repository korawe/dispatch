// The note being written is saved on the device as you go (decision 34), so you can leave it and come back.
import { readLocal } from "./local.ts";

export const NOTE_KEY = "dispatch-note-v1";

type SavedNote = { actions?: unknown[]; step?: string; answers?: { ownerId?: string } };

/** True if there's a note part-way through, so the home page can offer to continue it. */
export function noteInProgress(): boolean {
  const saved = readLocal<SavedNote | null>(NOTE_KEY, null);
  if (!saved) return false;
  return (saved.actions?.length ?? 0) > 0 || (saved.step !== undefined && saved.step !== "owner") || !!saved.answers?.ownerId;
}
