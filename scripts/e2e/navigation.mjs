// Moves around the app by tapping its own links (no page reloads), as a person does, so Next.js keeps screens
// alive in the background. Covers a real bug: "I added Mary, but she's not on New note until I restart".
// Also: a spoken name that isn't a delegate offers to add them, and hands-free doesn't look on after leaving.
// At laptop size. Usage: node scripts/e2e/navigation.mjs [baseUrl]
import { openBrowser } from "./browser.mjs";

const t = await openBrowser("navigation", { width: 1280, height: 800, voice: true });
const tap = (text) => t.click(text, 700);

await t.go("/");
await t.setDevice({ "dispatch-people-v1": [{ id: "p1", name: "Priya", email: "priya@example.com" }] });
await t.go("/");

// The bug as reported: open New note, go home, add Mary, back to New note.
await tap("New note");
await t.check("New note shows Priya", /Who owns this action\?[\s\S]*Priya/);
await tap("Home");
await tap("＋ Add delegates");
await t.fill(0, "Mary");
await t.fill(1, "mary@example.com");
await tap("Add delegate");
await t.check("Mary added on Delegates", /Mary[\s\S]*mary@example\.com/);
await tap("Home");
await tap("New note");
await t.check("THE BUG: Mary is on New note straight away, no restart", /Who owns this action\?[\s\S]*Mary/);

// Saying someone who isn't a delegate offers to add them, name filled in.
await tap("🎙 Speak this answer");
await t.say("Bob stop", 700);
await t.check("offers to add Bob", /Or add Bob as a new delegate/);
const prefilled = await t.js(`[...document.querySelectorAll("main input")].filter((i) => i.checkVisibility())[0].value`);
t.ok(`Bob's name is filled in (it says "${prefilled}")`, prefilled === "Bob");
await t.fill(1, "bob@example.com");
await tap("Add and choose");
await t.check("Bob chosen as owner, on to what needs doing", /For Bob[\s\S]*What needs doing\?/);

// Leaving while hands-free is on, then coming back: it shouldn't look on.
await tap("🎙 Hands-free");
await t.check("hands-free on", /Hands-free on/);
await tap("Home");
await t.check("home offers to continue the note", /Continue your note/);
await tap("Continue your note");
await t.check("back on the note, hands-free shows as off", /Speak this answer[\s\S]*Hands-free/);
await tap("Home");
await tap("＋ Add delegates");
await t.check("Bob (added during the note) is on Delegates", /Bob[\s\S]*bob@example\.com/);
await t.finish();
