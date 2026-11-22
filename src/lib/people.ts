// Delegates: the people list (DispatchSpec.md §4), stored on the device (decision 34). Phase 2 adds role, full
// name, "also known as" and active. The extra fields are optional, so lists saved before Phase 2 still load.
import { newId, readLocal, writeLocal } from "./local.ts";

export type Person = {
  id: string;
  /** As you'd say it, e.g. "Priya". Used in the greeting. */
  name: string;
  email: string;
  /** e.g. "Priya Patel": tells two Priyas apart. */
  fullName?: string;
  /** e.g. "EA", "Head of Ops". */
  role?: string;
  /** Other names speech recognition might hear for them, e.g. "Pree", "Maria". */
  aka?: string[];
  /** false once you've stopped delegating to them. Missing means true. */
  active?: boolean;
};

export type PersonDetails = Omit<Person, "id">;

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

export const isActive = (p: Person) => p.active !== false;

const squash = (text: string) => text.trim().replace(/\s+/g, " ");

/** "Pree, Maria" -> ["Pree", "Maria"], without repeats (ignoring case). */
export function parseAka(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(/[,;\n]/)
    .map(squash)
    .filter((a) => a && !seen.has(a.toLowerCase()) && seen.add(a.toLowerCase()));
}

/** Tidied details: trimmed, empty optional fields left out. */
export function cleanDetails(d: PersonDetails): PersonDetails {
  const fullName = squash(d.fullName ?? "");
  const role = squash(d.role ?? "");
  const aka = parseAka((d.aka ?? []).join(","));
  return {
    name: squash(d.name),
    email: d.email.trim(),
    ...(fullName ? { fullName } : {}),
    ...(role ? { role } : {}),
    ...(aka.length ? { aka } : {}),
    ...(d.active === false ? { active: false } : {}),
  };
}

export function makePerson(d: PersonDetails): Person {
  return { id: newId(), ...cleanDetails(d) };
}

/** The person with one more "also known as" name, e.g. how speech recognition heard them. */
export function withAka(p: Person, alias: string): Person {
  return { ...p, aka: parseAka([...(p.aka ?? []), alias].join(",")) };
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const norm = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Every name a person goes by: name, full name and also known as. */
const namesOf = (p: Person) => [p.name, p.fullName ?? "", ...(p.aka ?? [])].map(norm).filter(Boolean);

// Words said around a name ("it's Priya", "give it to Tom please") that aren't part of it.
const FILLER = new Set(["it's", "its", "it", "is", "that's", "the", "a", "to", "for", "and", "please", "copy", "in", "cc", "owner", "give", "send", "oh", "um", "er"]);

/** A name as heard, without filler and with capitals: "it's maria please" -> "Maria". */
export function nameAsHeard(said: string) {
  return norm(said)
    .split(" ")
    .filter((w) => w && !FILLER.has(w))
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Delegates matching what you said or typed, best matches only: a name, full name or "also known as" exactly;
 * then a first name; then the most words in common ("Tom Jones", "Jones"); then part of a name ("Pri").
 * More than one result means Dispatch asks which you meant (§4). People you no longer delegate to are left out.
 */
export function matchPeople(people: Person[], said: string): Person[] {
  const s = norm(said);
  if (!s) return [];
  const active = people.filter(isActive);

  const exact = active.filter((p) => namesOf(p).includes(s));
  if (exact.length) return exact;

  const byFirstName = active.filter((p) => norm(p.name).split(" ")[0] === s);
  if (byFirstName.length) return byFirstName;

  const words = s.split(" ").filter((w) => !FILLER.has(w));
  const score = (p: Person) => words.filter((w) => namesOf(p).some((n) => n.split(" ").includes(w))).length;
  const best = Math.max(0, ...active.map(score));
  if (best > 0) return active.filter((p) => score(p) === best);

  return s.length >= 2 ? active.filter((p) => namesOf(p).some((n) => n.includes(s))) : [];
}

/**
 * How to show a delegate: just the name, unless another current delegate has the same one. Then the full name
 * ("Tom Jones"), or the name with their role or email ("Tom (Head of Ops)").
 */
export function displayName(p: Person, people: Person[]) {
  const clash = people.some((q) => q.id !== p.id && isActive(q) && norm(q.name) === norm(p.name));
  if (!clash) return p.name;
  if (p.fullName && norm(p.fullName) !== norm(p.name)) return p.fullName;
  return `${p.name} (${p.role || p.email})`;
}
