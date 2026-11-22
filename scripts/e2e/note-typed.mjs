// A whole note, typed, at iPhone size (spec §5, decision 37): a deadline said in passing, optional questions
// skipped, a deadline changed afterwards, progress kept across a reload, CC, and the finished emails.
// Usage: node scripts/e2e/note-typed.mjs [baseUrl]
import { openBrowser } from "./browser.mjs";

const t = await openBrowser("note-typed");
await t.go("/people");
await t.setDevice({
  "dispatch-people-v1": [
    { id: "p1", name: "Priya", email: "priya@example.com" },
    { id: "p2", name: "Tom", email: "tom@example.com" },
  ],
});
await t.go("/note");
await t.shot("1-owner");

// What needs doing first (with the deadline said in passing); the next two questions are optional.
await t.click("Priya");
await t.check("on to what needs doing, question 2 of 5", /question 2 of 5[\s\S]*What needs doing\?/i);
await t.type("pull the Q3 numbers by Friday, flag any variance over 5%");
await t.click("Next");
await t.check("why it matters is optional: Skip shown", /For Priya · Pull the Q3 numbers[\s\S]*Why does it matter\?[\s\S]*Optional[\s\S]*Skip/);
await t.type("the board wants Q3 against forecast");
await t.check("typing turns Skip into Next", /Next/);
await t.click("Next");
await t.click("Skip");
await t.check(
  "deadline already said: not asked, shown with where it came from",
  /Another action\?[\s\S]*Pull the Q3 numbers[\s\S]*Priya · Due 17:30, Fri [\s\S]*From what you said: “by Friday”/
);
await t.shot("2-another-said");

await t.click("Yes, add another");
await t.click("Tom");
await t.type("find and book a venue for 12 people");
await t.click("Next");
await t.click("Skip");
await t.type("venue confirmed and invite sent");
await t.click("Next");
await t.check("no deadline said: asked", /When is it due\?/);
await t.type("in 3 days");
await t.check("deadline previewed", /Due 17:30, /);
await t.shot("3-deadline");
await t.click("Add action");

// Change the deadline that was taken from what was said.
await t.click("Change date");
await t.type("Monday");
await t.check("new date previewed", /Due 17:30, Mon /);
await t.shot("4-changing");
await t.click("Save date");
await t.check("Priya's date changed, no longer marked as said", /Priya · Due 17:30, Mon [^\n]*\n(?!From what you said)/);

// Closing the app part-way loses nothing.
await t.reload();
await t.check("after a reload, still on 'Another action?'", /Another action\?/);

await t.click("No, that's everything");
await t.click("Tom");
await t.shot("5-cc");
await t.click("Done");
await t.click("No one");
await t.shot("6-drafts");

const e1 = await t.email();
console.log("   email 1:", JSON.stringify(e1));
t.ok(
  `Priya's subject from the action; skipped Outcome left out; changed date, so "by Friday" gone from Action`,
  /^Pull the Q3 numbers – by Mon /.test(e1.subject) &&
    /Context: The board/.test(e1.body) &&
    !/Outcome:/.test(e1.body) &&
    /Action: Pull the Q3 numbers, flag any variance over 5%\.\n/.test(e1.body)
);
await t.check("Tom is on CC", /tom@example\.com/);
await t.click("Next: Tom's email");
const e2 = await t.email();
console.log("   email 2:", JSON.stringify(e2));
t.ok(
  "Tom's subject from the action, skipped Context left out",
  /^Find and book a venue for 12 people – by /.test(e2.subject) && !/Context:/.test(e2.body) && /Outcome: Venue confirmed/.test(e2.body)
);
await t.shot("7-drafts-2");
await t.finish();
