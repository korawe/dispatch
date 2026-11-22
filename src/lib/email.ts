// Builds Dispatch's emails from guided capture (DispatchSpec.md §6, decision 33): a fixed template filled with
// your own answers, lightly tidied. One email per owner per note.
import { formatDay, formatDeadline } from "./dates.ts";

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

/** Groups actions by owner, keeping the order owners were first mentioned. */
export function groupByOwner(actions: CapturedAction[]) {
  const groups = new Map<string, CapturedAction[]>();
  for (const a of actions) groups.set(a.ownerId, [...(groups.get(a.ownerId) ?? []), a]);
  return groups;
}

export function buildDraft(owner: Recipient, actions: CapturedAction[], cc: Recipient[], signOff = SIGN_OFF): EmailDraft {
  const sorted = [...actions].sort((a, b) => a.deadline.localeCompare(b.deadline));
  const firstDue = formatDay(new Date(sorted[0].deadline));
  const titles = sorted.map((a) => tidyTitle(a.title));

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
      `Context: ${tidy(a.context)}`,
      `Action: ${tidy(a.action)}`,
      `Outcome: ${tidy(a.outcome)}`,
      `Deadline: ${formatDeadline(new Date(a.deadline))}`
    );
  } else {
    lines.push(`${COUNT_WORDS[sorted.length] ?? sorted.length} things for you to own:`);
    sorted.forEach((a, i) => {
      lines.push(
        "",
        `${i + 1}. ${titles[i]}`,
        `   Context: ${tidy(a.context)}`,
        `   Action: ${tidy(a.action)}`,
        `   Outcome: ${tidy(a.outcome)}`,
        `   Deadline: ${formatDeadline(new Date(a.deadline))}`
      );
    });
  }
  lines.push("", signOff);

  return { ownerId: owner.id, to: owner.email.trim(), cc: cc.map((p) => p.email.trim()), subject, body: lines.join("\n") };
}
