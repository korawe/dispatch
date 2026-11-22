// Delegates (spec §4, decision 39): full details on the Delegates page, two Toms, teaching Dispatch a misheard
// name by voice, and someone you no longer delegate to. Usage: node scripts/e2e/delegates.mjs [baseUrl]
import { openBrowser } from "./browser.mjs";

const t = await openBrowser("delegates", { voice: true });
const answer = async (text) => {
  await t.say(text, 300);
  await t.say("next", 600);
};
const skip = () => t.say("next", 600);

// A list saved before Phase 2 (name and email only) still loads.
await t.go("/people");
await t.setDevice({
  "dispatch-people-v1": [
    { id: "p1", name: "Priya", email: "priya@example.com" },
    { id: "b1", name: "Bob", email: "bob@example.com" },
  ],
});
await t.reload();
await t.check("a list saved before Phase 2 still loads", /Priya[\s\S]*priya@example\.com[\s\S]*Bob/);

// Tom, with full details.
await t.click("More details: role, full name, also known as");
await t.fill("Name", "Tom");
await t.fill("Email", "tom.j@example.com");
await t.fill("Role", "Head of Ops");
await t.fill("Full name", "Tom Jones");
await t.click("Add delegate");
await t.check("Tom added with role and full name", /Tom · Tom Jones\s*Head of Ops · tom\.j@example\.com/);

// A second Tom: Dispatch points out the clash and offers the full name.
await t.fill("Name", "Tom");
await t.check("second Tom: warned, full name offered", /You already have a Tom \(Tom Jones\)\. Add a full name below[\s\S]*Full name \(optional\)/);
await t.fill("Email", "tom.s@example.com");
await t.fill("Full name", "Tom Smith");
await t.click("Add delegate");

// Bob has left: untick "Still delegating to them". The list is Priya, Bob, Tom, Tom, so Bob's Edit is second.
await t.js(`[...document.querySelectorAll("button")].filter((b) => b.checkVisibility() && b.textContent.trim() === "Edit")[1].click()`);
await t.check("editing Bob shows Still delegating to them", /Still delegating to them/);
await t.fill("Still delegating to them");
await t.click("Save");
await t.check("Bob moved to No longer delegating to", /No longer delegating to[\s\S]*Bob/);
await t.shot("1-delegates");

// In a note: the two Toms are told apart, and Bob isn't offered.
await t.go("/note");
await t.check("owner buttons: Tom Jones and Tom Smith told apart", /Priya\s*Tom Jones\s*Tom Smith/);
await t.check("Bob not offered", /\bBob\b/, { not: true });

await t.click("🎙 Hands-free");
await answer("Tom");
await t.check("'Tom' asks which one", /“Tom” could be Tom Jones or Tom Smith\. Say their full name, or tap the one you mean\./);
await answer("Tom Smith");
await t.check("'Tom Smith' chosen", /For Tom Smith[\s\S]*What needs doing\?/);
await answer("check the supplier contract by Friday");
await skip(); // why it matters
await skip(); // what done looks like
await t.check("action added for Tom Smith", /Another action\?[\s\S]*Tom Smith · Due/);
await answer("yes");

// A misheard name: tap who was meant, and Dispatch remembers it.
await answer("it's Maria");
await t.check(
  "unknown name: offers to tap who was meant, or add them",
  /Who owns this action\?[^]*?later\.\s*Did you mean someone on your list\?[\s\S]*“Maria” means them from now on[\s\S]*Or add Maria as a new delegate/
);
await t.check("…and says so", /Maria isn't one of your delegates\. Add them below, or tap who you meant\./);
await t.shot("2-did-you-mean");
await t.clickIn("Did you mean someone on your list?", "Priya");
await t.check("Priya chosen", /For Priya[\s\S]*What needs doing\?/);
const priya = (await t.saved("dispatch-people-v1")).find((p) => p.name === "Priya");
t.ok(`"Maria" saved as one of Priya's names (also known as: ${JSON.stringify(priya?.aka)})`, !!priya?.aka?.includes("Maria"));
await answer("book the board room for Thursday's review by Wednesday");
await skip();
await skip();
await answer("yes");
await answer("Maria");
await t.check("next time, 'Maria' is Priya straight away", /For Priya[\s\S]*What needs doing\?/);
await t.click("Back");
await answer("Bob");
await t.check("Bob: says he's under No longer delegating to", /Bob is under "No longer delegating to" on the Delegates page/);
await t.finish();
