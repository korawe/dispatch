// Builds Dispatch's emails from guided capture (DispatchSpec.md §6, decision 33): a fixed template filled with
// your own answers, lightly tidied. One email per owner per note.
import { formatDay, formatDeadline, parseDeadline } from "./dates.ts";

export type CapturedAction = {
  ownerId: string;
  title: string;
  context: string;
  action: string;
  outcome: string;
  /** ISO date-time. */
  deadline: string;
};

export type Recipient = { id: string; name: string; email: string };

export type EmailDraft = {
  ownerId: string;
  to: string;
  cc: string[];
  subject: string;
  body: string;
};

/** Every email ends with this (§6). It becomes a setting later. */
export const SIGN_OFF = "Thanks, Killian";

const COUNT_WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

const squash = (text: string) => text.trim().replace(/\s+/g, " ");

/** A capital letter at the start and a full stop at the end, unless it already ends with punctuation. */
export function tidy(text: string) {
  const t = squash(text);
  if (!t) return t;
  const capped = t[0].toUpperCase() + t.slice(1);
  return /[.!?…]$/.test(capped) ? capped : `${capped}.`;
}

/** A title: a capital letter at the start, no full stop. */
export function tidyTitle(text: string) {
  const t = squash(text).replace(/[.!]+$/, "");
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

/**
 * The action's title for the subject line: the title given, or (since decision 37 dropped the title question)
 * the start of what needs doing, up to eight words, without a trailing deadline ("by Friday"), which the subject
 * line already shows.
 */
export function titleFor(a: Pick<CapturedAction, "title" | "action">) {
  if (a.title.trim()) return tidyTitle(a.title);
  let clause = squash(a.action).split(/[,;:.!?]| [-–] /)[0] ?? "";
  const cue = clause.search(/\s(?:by|due|before|until|no later than|within|in)\s/i);
  if (cue > 0 && parseDeadline(clause.slice(cue).replace(/^\s*within\b/i, " in")).kind !== "unknown") clause = clause.slice(0, cue);
  const words = clause.split(" ").filter(Boolean);
  return tidyTitle(words.length > 8 ? `${words.slice(0, 8).join(" ")}…` : words.join(" "));
}

/** Groups actions by owner, keeping the order owners were first mentioned. */
export function groupByOwner(actions: CapturedAction[]) {
  const groups = new Map<string, CapturedAction[]>();
  for (const a of actions) groups.set(a.ownerId, [...(groups.get(a.ownerId) ?? []), a]);
  return groups;
}

export function buildDraft(owner: Recipient, actions: CapturedAction[], cc: Recipient[], signOff = SIGN_OFF): EmailDraft {
  const sorted = [...actions].sort((a, b) => a.deadline.localeCompare(b.deadline));
  const firstDue = formatDay(new Date(sorted[0].deadline));
  const titles = sorted.map(titleFor);
  // "Why does it matter?" and "What does done look like?" are optional (decision 37): skipped ones are left out.
  const optional = (label: string, text: string, indent = "") => (text.trim() ? [`${indent}${label}: ${tidy(text)}`] : []);

  const subject =
    sorted.length === 1
      ? `${titles[0]} – by ${firstDue}`
      : `${sorted.length} actions: ${titles.slice(0, 2).join(", ")}${sorted.length > 2 ? "…" : ""} – first due ${firstDue}`;

  const lines = [`Hi ${squash(owner.name)},`, ""];
  if (sorted.length === 1) {
    const a = sorted[0];
    lines.push(
      "Can you own this, please?",
      "",
      ...optional("Context", a.context),
      `Action: ${tidy(a.action)}`,
      ...optional("Outcome", a.outcome),
      `Deadline: ${formatDeadline(new Date(a.deadline))}`
    );
  } else {
    lines.push(`${COUNT_WORDS[sorted.length] ?? sorted.length} things for you to own:`);
    sorted.forEach((a, i) => {
      lines.push(
        "",
        `${i + 1}. ${titles[i]}`,
        ...optional("Context", a.context, "   "),
        `   Action: ${tidy(a.action)}`,
        ...optional("Outcome", a.outcome, "   "),
        `   Deadline: ${formatDeadline(new Date(a.deadline))}`
      );
    });
  }
  lines.push("", signOff);

  return { ownerId: owner.id, to: owner.email.trim(), cc: cc.map((p) => p.email.trim()), subject, body: lines.join("\n") };
}
