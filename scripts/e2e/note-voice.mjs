// A whole note by voice, with a pretend speech recogniser (decisions 32, 35 and 37): one answer by tap, the rest
// hands-free, ending answers with "next" or "stop" (sometimes twice), skipping optional questions, and a vague
// deadline. With "iphone", the app takes its iPhone path, which must use ONE listening session for the whole
// note (starting and stopping one per answer leaves a real iPhone hearing nothing).
// Usage: node scripts/e2e/note-voice.mjs [baseUrl] [iphone]
import { openBrowser, sleep } from "./browser.mjs";

const asIPhone = process.argv[3] === "iphone";
const t = await openBrowser(asIPhone ? "note-voice-iphone" : "note-voice-laptop", { voice: true, iphone: asIPhone });
if (asIPhone) console.log("(pretending to be an iPhone)");

// Each answer, then a pause to think (which must NOT end it), then "next" or "stop" said separately.
// Every third answer says the end word twice, as if the first wasn't picked up.
let said = 0;
const answer = async (text) => {
  said++;
  const end = said % 2 ? "next" : "stop";
  await t.say(text, 1800);
  await t.say(said % 3 === 0 ? `${end} ${end}` : end, 500);
};

await t.go("/people");
await t.setDevice({
  "dispatch-people-v1": [
    { id: "p1", name: "Priya", email: "priya@example.com" },
    { id: "p2", name: "Tom", email: "tom@example.com" },
  ],
});
await t.go("/note");
await t.check("voice controls shown", /Read questions aloud: off[\s\S]*Speak this answer[\s\S]*Hands-free/);

// One answer by voice (a tap per answer).
await t.click("🎙 Speak this answer", 200);
await t.check("listening after tapping Speak this answer", /Listening – say “next” or “stop” when you've finished[\s\S]*Done/);
await answer("Bob");
await t.check("unknown name: offers to add them, not guessed", /Or add Bob as a new delegate[\s\S]*Bob isn't one of your delegates\. Add them below, or tap who you meant\./);
await t.click("🎙 Speak this answer", 200);
await answer("Priya");
await t.check("Priya chosen, on to what needs doing", /What needs doing\?/);
await t.check("the Add Bob form closed once Priya was chosen", /add Bob as a new delegate/i, { not: true });
await t.shot("1-after-one-answer");

// The rest hands-free: no more taps.
await t.click("🎙 Hands-free");
await t.check("hands-free on", /Hands-free on/);
await answer("pull revenue and costs by Friday");
await t.check("action taken, on to why it matters", /Why does it matter\?/);
await answer("the board wants Q3 against forecast");
await t.check("on to what done looks like", /What does done look like\?/);
await t.say("next"); // just "next" skips an optional question
await t.check("deadline already said: not asked, shown instead", /Another action\?[\s\S]*Pull revenue and costs[\s\S]*Due 17:30, Fri [\s\S]*From what you said: “by Friday”/);
await answer("yes");
await answer("Tom");
await answer("book a venue for 12 people");
await t.check("on to why it matters", /Why does it matter\?/);
await answer("skip");
await t.check("'skip' skips it", /What does done look like\?/);
await answer("venue confirmed and invite sent");
await t.check("no deadline said: asked", /When is it due\?/);
await answer("soon");
await t.check("vague deadline asked about", /a bit vague/);
await answer("in 3 days");
await t.check("second action added", /Another action\?[\s\S]*Book a venue for 12 people/);
await answer("no, that's everything");
await t.check("CC question for Priya", /Anyone to copy in on Priya's email\?/);
await answer("Tom");
await t.check("CC question for Tom", /Anyone to copy in on Tom's email\?/);

// How many listening sessions did the note start, and were any cut off?
const sessions = await t.js(`({ started: __recs.length, cutOff: __recs.filter((r) => r.aborted).length })`);
if (asIPhone) {
  t.ok(`iPhone used one listening session for the whole note (${sessions.started} started, ${sessions.cutOff} cut off)`, sessions.started === 1 && sessions.cutOff === 0);
} else {
  console.log(`   (laptop: ${sessions.started} listening sessions started, ${sessions.cutOff} cut off)`);
}
await answer("no one");
await sleep(300);
await t.check("emails ready, hands-free stopped", /Priya's email/);
await t.shot("2-drafts");
const email = await t.email();
console.log("   email 1:", JSON.stringify(email));
t.ok(
  `subject from the action without "by Friday"; skipped Outcome left out`,
  /^Pull revenue and costs – by Fri /.test(email.subject) && /Context: The board/.test(email.body) && !/Outcome:/.test(email.body)
);
await t.check("Tom is on CC", /tom@example\.com/);
await t.click("Next: Tom's email");
console.log("   email 2:", JSON.stringify(await t.email()));
await t.finish();
