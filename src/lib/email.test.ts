// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDraft, groupByOwner, tidy, type CapturedAction } from "./email.ts";

const priya = { id: "p", name: "Priya", email: "priya@example.com" };
const tom = { id: "t", name: "Tom", email: "tom@example.com" };

const q3: CapturedAction = {
  ownerId: "p",
  title: "Q3 board numbers",
  context: "the board wants to see Q3 against forecast",
  action: "pull revenue and costs, flag any variance over 5%",
  outcome: "a one-page summary I can drop into the pack",
  deadline: new Date(2026, 10, 27, 17, 30).toISOString(),
};

test("one action: subject and body follow §6", () => {
  const d = buildDraft(priya, [q3], [tom]);
  assert.equal(d.to, "priya@example.com");
  assert.deepEqual(d.cc, ["tom@example.com"]);
  assert.equal(d.subject, "Q3 board numbers – by Fri 27 Nov");
  assert.equal(
    d.body,
    [
      "Hi Priya,",
      "",
      "Can you own this, please?",
      "",
      "Context: The board wants to see Q3 against forecast.",
      "Action: Pull revenue and costs, flag any variance over 5%.",
      "Outcome: A one-page summary I can drop into the pack.",
      "Deadline: 17:30, Fri 27 Nov",
      "",
      "Thanks, Killian",
    ].join("\n")
  );
});

test("several actions: numbered, soonest first, subject says first due", () => {
  const offsite: CapturedAction = {
    ownerId: "t",
    title: "offsite booking",
    context: "we need a day together before planning season",
    action: "find and book a venue for 12 people in early December",
    outcome: "venue confirmed and invite sent",
    deadline: new Date(2026, 10, 25, 17, 30).toISOString(),
  };
  const supplier: CapturedAction = { ...offsite, title: "supplier review", deadline: new Date(2026, 11, 4, 17, 30).toISOString() };
  const d = buildDraft(tom, [supplier, offsite], []);
  assert.equal(d.subject, "2 actions: Offsite booking, Supplier review – first due Wed 25 Nov");
  assert.match(d.body, /^Hi Tom,\n\nTwo things for you to own:\n\n1\. Offsite booking\n {3}Context: We need a day together/);
  assert.match(d.body, /\n2\. Supplier review\n/);
  assert.match(d.body, /Deadline: 17:30, Fri 4 Dec\n\nThanks, Killian$/);
});

test("three or more titles: the subject lists two and trails off", () => {
  const a = { ...q3, title: "one" };
  const d = buildDraft(priya, [a, { ...a, title: "two" }, { ...a, title: "three" }], []);
  assert.match(d.subject, /^3 actions: One, Two… – first due /);
});

test("tidy keeps existing punctuation", () => {
  assert.equal(tidy("  is it done?  "), "Is it done?");
  assert.equal(tidy("ship it"), "Ship it.");
  assert.equal(tidy(""), "");
});

test("groupByOwner keeps first-mentioned order", () => {
  const groups = groupByOwner([{ ...q3, ownerId: "t" }, q3, { ...q3, ownerId: "t" }]);
  assert.deepEqual([...groups.keys()], ["t", "p"]);
  assert.equal(groups.get("t")?.length, 2);
});
