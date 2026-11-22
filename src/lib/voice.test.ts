// Run with: npm test
// The listening session with a pretend recogniser and a pretend clock, so no microphone is needed.
import { mock, test } from "node:test";
import assert from "node:assert/strict";
import { VoiceSession, withoutEndWord, type Recognition, type VoiceOptions } from "./voice.ts";

function fakeRecogniser() {
  const rec = {
    lang: "",
    continuous: false,
    interimResults: false,
    starts: 0,
    aborts: 0,
    start() {
      this.starts++;
    },
    stop() {},
    abort() {
      this.aborts++;
    },
    onstart: null as (() => void) | null,
    onresult: null as ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null,
    onerror: null as ((e: { error: string }) => void) | null,
    onend: null as (() => void) | null,
  };
  // What the browser sends: every phrase heard so far in this run of the session.
  const hear = (...phrases: string[]) =>
    rec.onresult?.({ results: phrases.map((t) => Object.assign([{ transcript: t }], { isFinal: true })) });
  return { rec, hear };
}

function session(opts: Partial<VoiceOptions> & { keepOpen: boolean }) {
  const { rec, hear } = fakeRecogniser();
  const answers: string[] = [];
  const problems: string[] = [];
  const s = new VoiceSession({
    create: () => rec as Recognition,
    onAnswer: (t) => answers.push(t),
    onProblem: (p) => problems.push(p),
    ...opts,
  });
  assert.equal(s.start(), true);
  rec.onstart?.();
  return { s, rec, hear, answers, problems };
}

test("withoutEndWord: 'stop' or 'next' as the last word ends an answer and is dropped", () => {
  assert.equal(withoutEndWord("Priya stop"), "Priya");
  assert.equal(withoutEndWord("Priya, next."), "Priya");
  assert.equal(withoutEndWord("pull revenue and costs, stop."), "pull revenue and costs");
  assert.equal(withoutEndWord("Stop"), "");
  assert.equal(withoutEndWord("Next"), "");
  assert.equal(withoutEndWord("Priya"), null);
  assert.equal(withoutEndWord("stopping the rollout"), null);
  assert.equal(withoutEndWord(""), null);
});

test("withoutEndWord: saying it twice (the first wasn't picked up) leaves neither in the answer", () => {
  assert.equal(withoutEndWord("Q3 board numbers stop stop"), "Q3 board numbers");
  assert.equal(withoutEndWord("Q3 board numbers stop. Stop."), "Q3 board numbers");
  assert.equal(withoutEndWord("Q3 board numbers next stop"), "Q3 board numbers");
});

test("withoutEndWord: 'next' earlier in an answer doesn't end it", () => {
  assert.equal(withoutEndWord("by next Friday"), null);
  assert.equal(withoutEndWord("plan for next week"), null);
  assert.equal(withoutEndWord("by next Friday next"), "by next Friday");
});

test("a session ends an answer on 'next' too", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, hear, answers } = session({ keepOpen: true });
  s.openWindow();
  hear("a one-page summary", "next");
  assert.deepEqual(answers, ["a one-page summary"]);
  mock.timers.reset();
});

test("laptop: pauses don't end an answer; 'stop' does, and isn't included", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, rec, hear, answers } = session({ keepOpen: false });
  s.openWindow();
  hear("pull revenue");
  mock.timers.tick(5000); // a long pause to think
  assert.deepEqual(answers, []);
  hear("pull revenue", "and costs stop");
  assert.deepEqual(answers, ["pull revenue and costs"]);
  assert.equal(rec.aborts, 1); // Chrome is fine with being cut off
  mock.timers.reset();
});

test("iPhone: listens phrase by phrase until 'stop', and never cuts the mic off after words", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, rec, hear, answers } = session({ keepOpen: false, continuous: false, letItEnd: true });
  s.openWindow();
  hear("pull revenue");
  rec.onend?.(); // the iPhone ends the phrase at your pause
  assert.equal(rec.starts, 2); // Dispatch carries on listening
  assert.deepEqual(answers, []);
  rec.onstart?.();
  hear("and costs stop");
  assert.deepEqual(answers, ["pull revenue and costs"]);
  assert.equal(rec.aborts, 0);
  rec.onend?.(); // the iPhone finishes by itself after "stop"
  assert.equal(rec.starts, 2); // and isn't restarted
  mock.timers.tick(10_000);
  assert.equal(rec.aborts, 0);
  mock.timers.reset();
});

test("iPhone: steps in after 6s if the iPhone never finishes after 'stop'", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, rec, hear, answers } = session({ keepOpen: false, continuous: false, letItEnd: true });
  s.openWindow();
  hear("Priya stop");
  assert.deepEqual(answers, ["Priya"]);
  mock.timers.tick(6000);
  assert.equal(rec.aborts, 1);
  mock.timers.reset();
});

test("Done button finishes with what was said so far", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, hear, answers } = session({ keepOpen: false });
  s.openWindow();
  hear("a one-page summary");
  s.finishNow();
  assert.deepEqual(answers, ["a one-page summary"]);
  mock.timers.reset();
});

test("an answer finishes after 20s with no new words", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, answers } = session({ keepOpen: false });
  s.openWindow();
  mock.timers.tick(20_000);
  assert.deepEqual(answers, [""]);
  mock.timers.reset();
});

test("hands-free: each answer is only the words after its question, ended by 'stop'", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, rec, hear, answers } = session({ keepOpen: true });
  s.openWindow();
  hear("Priya stop");
  s.openWindow(); // next question
  hear("Priya stop", "Q3 board numbers");
  mock.timers.tick(3000);
  hear("Priya stop", "Q3 board numbers stop");
  hear("Priya stop", "Q3 board numbers stop", "ignored until the next question");
  assert.deepEqual(answers, ["Priya", "Q3 board numbers"]);
  assert.equal(rec.aborts, 0); // the session stays open between answers
  mock.timers.reset();
});

test("hands-free: if the browser ends the session mid-answer, it restarts and keeps what was said", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, rec, hear, answers } = session({ keepOpen: true });
  s.openWindow();
  hear("Q3 board");
  rec.onend?.();
  assert.equal(rec.starts, 2);
  rec.onstart?.();
  hear("numbers stop"); // a fresh run starts its words again
  assert.deepEqual(answers, ["Q3 board numbers"]);
  mock.timers.reset();
});

test("note-long session (iPhone): each tap opens an answer on the same session, nothing restarted or cut off", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const windows: boolean[] = [];
  const { s, rec, hear, answers } = session({ keepOpen: true, onWindow: (open) => windows.push(open) });
  s.openWindow(); // first tap
  hear("Priya", "stop");
  hear("Priya", "stop", "chatting between questions"); // not answering: ignored
  s.openWindow(); // next tap
  hear("Priya", "stop", "chatting between questions", "Q3 board numbers");
  mock.timers.tick(5000); // a pause to think
  hear("Priya", "stop", "chatting between questions", "Q3 board numbers", "stop");
  assert.deepEqual(answers, ["Priya", "Q3 board numbers"]);
  assert.deepEqual(windows, [true, false, true, false]);
  assert.equal(rec.starts, 1);
  assert.equal(rec.aborts, 0);
  assert.equal(s.alive, true);
  mock.timers.reset();
});

test("closing an answer keeps the mic session running", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, rec, hear, answers } = session({ keepOpen: true });
  s.openWindow();
  hear("half an answer");
  s.closeWindow();
  hear("half an answer", "stop");
  assert.deepEqual(answers, []);
  assert.equal(rec.aborts, 0);
  assert.equal(s.alive, true);
  mock.timers.reset();
});

test("iPhone with Speak questions on: the iPhone ending at your pause ends the answer", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, rec, hear, answers } = session({ keepOpen: false, continuous: false, letItEnd: true, endAtPause: true });
  s.openWindow();
  hear("Priya");
  rec.onend?.();
  assert.deepEqual(answers, ["Priya"]);
  assert.equal(rec.starts, 1); // no restart
  assert.equal(rec.aborts, 0);
  mock.timers.reset();
});

test("not allowed: says so and stops", () => {
  const { rec, problems } = session({ keepOpen: true });
  rec.onerror?.({ error: "not-allowed" });
  assert.equal(problems.length, 1);
  assert.equal(rec.aborts, 1);
  rec.onend?.();
  assert.equal(rec.starts, 1); // no restart after a stop
});
