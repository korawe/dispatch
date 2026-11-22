// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDeadline, parseDeadline, type Deadline } from "./dates.ts";

// Thursday 19 November 2026, 10:00.
const NOW = new Date(2026, 10, 19, 10, 0);

function due(input: string, now = NOW) {
  const d: Deadline = parseDeadline(input, now);
  if (d.kind !== "ok") return d.kind === "past" ? `past ${formatDeadline(d.at)}` : d.kind;
  return formatDeadline(d.at) + (d.moved ? " (moved)" : "");
}

test("spec §7: 'in 3 days' said on a Thursday is Tuesday at 17:30", () => {
  assert.equal(due("in 3 days"), "17:30, Tue 24 Nov");
  assert.equal(due("in three working days"), "17:30, Tue 24 Nov");
});

test("today, tomorrow and end of day", () => {
  assert.equal(due("today"), "17:30, Thu 19 Nov");
  assert.equal(due("end of day"), "17:30, Thu 19 Nov");
  assert.equal(due("EOD"), "17:30, Thu 19 Nov");
  assert.equal(due("tomorrow"), "17:30, Fri 20 Nov");
  assert.equal(due("by tomorrow at 3pm"), "15:00, Fri 20 Nov");
  assert.equal(due("noon tomorrow"), "12:00, Fri 20 Nov");
});

test("weekdays: bare, this and next", () => {
  assert.equal(due("Friday"), "17:30, Fri 20 Nov");
  assert.equal(due("by Monday"), "17:30, Mon 23 Nov");
  assert.equal(due("Thursday"), "17:30, Thu 19 Nov"); // today counts
  assert.equal(due("next Friday"), "17:30, Fri 27 Nov");
  assert.equal(due("Wednesday 12:30"), "12:30, Wed 25 Nov");
  assert.equal(due("this Monday"), "past 17:30, Mon 16 Nov");
});

test("end of week", () => {
  assert.equal(due("end of the week"), "17:30, Fri 20 Nov");
  assert.equal(due("end of next week"), "17:30, Fri 27 Nov");
  // Said on a Saturday, "end of the week" is the coming Friday.
  assert.equal(due("end of the week", new Date(2026, 10, 21, 10, 0)), "17:30, Fri 27 Nov");
});

test("dates with a month", () => {
  assert.equal(due("25 November"), "17:30, Wed 25 Nov");
  assert.equal(due("the 25th of November"), "17:30, Wed 25 Nov");
  assert.equal(due("November 25th"), "17:30, Wed 25 Nov");
  assert.equal(due("25/11"), "17:30, Wed 25 Nov");
  assert.equal(due("25/11/2026"), "17:30, Wed 25 Nov");
  assert.equal(due("15 January"), "17:30, Fri 15 Jan"); // next year
  assert.equal(due("18 November"), "past 17:30, Wed 18 Nov");
});

test("the 25th: this month, or next month once passed", () => {
  assert.equal(due("the 30th"), "17:30, Mon 30 Nov");
  assert.equal(due("the 3rd"), "17:30, Thu 3 Dec");
  // In December, "the 4th" rolls over to January (Mon 4 Jan 2027).
  assert.equal(due("the 4th", new Date(2026, 11, 10, 10, 0)), "17:30, Mon 4 Jan");
});

test("relative weeks", () => {
  assert.equal(due("in 2 weeks"), "17:30, Thu 3 Dec");
  assert.equal(due("in a week"), "17:30, Thu 26 Nov");
  assert.equal(due("in a fortnight"), "17:30, Thu 3 Dec");
});

test("spec §7: a weekend moves to the next working day at 17:30, flagged", () => {
  assert.equal(due("Saturday"), "17:30, Mon 23 Nov (moved)");
  assert.equal(due("Sunday at 10am"), "17:30, Mon 23 Nov (moved)");
  assert.equal(due("28 November"), "17:30, Mon 30 Nov (moved)");
});

test("spec §7: past deadlines are flagged, not moved", () => {
  // At 18:00, "today" (17:30) has passed.
  assert.equal(due("today", new Date(2026, 10, 19, 18, 0)), "past 17:30, Thu 19 Nov");
});

test("spec §7: vague deadlines are asked about", () => {
  for (const vague of ["soon", "ASAP", "as soon as you can", "when you can", "next week", "no rush"]) {
    assert.equal(due(vague), "vague", vague);
  }
});

test("things that aren't dates", () => {
  assert.equal(due("banana"), "unknown");
  assert.equal(due(""), "unknown");
  assert.equal(due("31 February"), "unknown");
});
