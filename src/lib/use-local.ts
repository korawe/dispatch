// Live views of what's saved on the device. Screens kept alive in the background by Next.js update as soon as
// something changes, so they never show an old copy (see local.ts).
import { useSyncExternalStore } from "react";
import { subscribeLocal } from "./local";
import { noteInProgress } from "./note-progress";
import { peopleSnapshot, type Person } from "./people";

const NO_PEOPLE: Person[] = [];

/** Your delegates, always up to date. */
export function usePeople(): Person[] {
  return useSyncExternalStore(subscribeLocal, peopleSnapshot, () => NO_PEOPLE);
}

/** Whether a note is part-way through, always up to date. */
export function useNoteInProgress(): boolean {
  return useSyncExternalStore(subscribeLocal, noteInProgress, () => false);
}
