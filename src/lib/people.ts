// The simple people list for Phase 1: name and email, stored on the device (decision 34). The full list
// (role, also known as, active) comes in Phase 2 (DispatchSpec.md §4).
import { newId, readLocal, writeLocal } from "./local.ts";

export type Person = { id: string; name: string; email: string };

const PEOPLE_KEY = "dispatch-people-v1";

export const loadPeople = () => readLocal<Person[]>(PEOPLE_KEY, []);
export const savePeople = (people: Person[]) => writeLocal(PEOPLE_KEY, people);

// The same list each time until it changes, as useSyncExternalStore needs.
let cachedRaw: string | null | undefined;
let cachedPeople: Person[] = [];
export function peopleSnapshot(): Person[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PEOPLE_KEY);
  } catch {
    /* storage unavailable */
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedPeople = loadPeople();
  }
  return cachedPeople;
}

export function makePerson(name: string, email: string): Person {
  return { id: newId(), name: name.trim().replace(/\s+/g, " "), email: email.trim() };
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/**
 * People matching what you said or typed: an exact first or full name first, then partial matches.
 * More than one result means Dispatch asks which you meant (§4).
 */
export function matchPeople(people: Person[], said: string): Person[] {
  const s = said.toLowerCase().replace(/[.,!?]/g, "").trim();
  if (!s) return [];
  const first = (p: Person) => p.name.toLowerCase().split(" ")[0];
  const exact = people.filter((p) => p.name.toLowerCase() === s || first(p) === s);
  if (exact.length) return exact;
  return people.filter((p) => p.name.toLowerCase().includes(s) || s.split(" ").includes(first(p)));
}
