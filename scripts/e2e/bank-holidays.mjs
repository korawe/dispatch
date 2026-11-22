// Bank holidays (spec §7, decision 38): the latest gov.uk list is fetched and saved on the device, and a deadline
// on Christmas Day is moved, with the reason, whether typed or said in passing.
// Usage: node scripts/e2e/bank-holidays.mjs [baseUrl]
import { openBrowser } from "./browser.mjs";

const t = await openBrowser("bank-holidays");
await t.go("/people");
await t.setDevice({ "dispatch-people-v1": [{ id: "p1", name: "Priya", email: "priya@example.com" }] });
await t.go("/note", 4000); // time to fetch the list

const saved = await t.saved("dispatch-bank-holidays-v1");
t.ok(
  `latest list fetched from gov.uk and saved on the device${saved ? ` (${saved.holidays.length}, ${saved.holidays[0].date} to ${saved.holidays.at(-1).date})` : ""}`,
  !!saved && Array.isArray(saved.holidays) && saved.holidays.some((h) => h.date === "2026-12-25"),
  "If the app runs on a network that inspects HTTPS, start it with NODE_OPTIONS=--use-system-ca (see README)."
);

// Typed at "When is it due?".
await t.click("Priya");
await t.type("book the venue for the team lunch");
await t.click("Next");
await t.click("Skip");
await t.click("Skip");
await t.type("25 December");
await t.check(
  "Christmas Day moved to Tue 29 Dec, with the reason",
  /Due 17:30, Tue 29 Dec[\s\S]*Fri 25 Dec is Christmas Day and Mon 28 Dec is the substitute day for Boxing Day, so it's moved to the next working day/
);
await t.shot("1-christmas");

// Said in passing in the answer.
await t.click("Back");
await t.click("Back");
await t.click("Back");
await t.type("book the venue for the team lunch by 25 December");
await t.click("Next");
await t.click("Skip");
await t.click("Skip");
await t.check("said in passing: shown moved, with the reason", /Due 17:30, Tue 29 Dec[\s\S]*From what you said: “by 25 December”\. Fri 25 Dec is Christmas Day/);
await t.shot("2-another");
await t.finish();
