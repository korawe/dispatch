// Run with: npm test
// The listening session with a pretend recogniser and a pretend clock, so no microphone is needed.
import { mock, test } from "node:test";
import assert from "node:assert/strict";
import { VoiceSession, type Recognition } from "./voice.ts";

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
  // What the browser sends: every phrase heard so far in this session.
  const hear = (...phrases: string[]) =>
    rec.onresult?.({ results: phrases.map((t) => Object.assign([{ transcript: t }], { isFinal: true })) });
  return { rec, hear };
}

function session(keepOpen: boolean) {
  const { rec, hear } = fakeRecogniser();
  const answers: string[] = [];
  const problems: string[] = [];
  const s = new VoiceSession({
    keepOpen,
    create: () => rec as Recognition,
    onAnswer: (t) => answers.push(t),
    onProblem: (p) => problems.push(p),
  });
  assert.equal(s.start(), true);
  rec.onstart?.();
  return { s, rec, hear, answers, problems };
}

test("one answer: ends 1.5s after the words stop, then stops the mic", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, rec, hear, answers } = session(false);
  s.openWindow();
  hear("pull revenue");
  mock.timers.tick(1000);
  hear("pull revenue and costs"); // still talking: the pause starts again
  mock.timers.tick(1000);
  assert.deepEqual(answers, []);
  mock.timers.tick(500);
  assert.deepEqual(answers, ["pull revenue and costs"]);
  assert.equal(rec.aborts, 1);
  mock.timers.reset();
});

test("one answer: gives up after 8s with no words", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, answers } = session(false);
  s.openWindow();
  mock.timers.tick(8000);
  assert.deepEqual(answers, [""]);
  mock.timers.reset();
});

test("one answer: if the browser ends early, what was heard is used", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, rec, hear, answers } = session(false);
  s.openWindow();
  hear("Priya");
  rec.onend?.();
  assert.deepEqual(answers, ["Priya"]);
  mock.timers.reset();
});

test("hands-free: each answer is only the words after its question", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, hear, answers } = session(true);
  s.openWindow();
  hear("Priya");
  mock.timers.tick(1500);
  s.openWindow(); // next question
  hear("Priya", "Q3 board numbers");
  mock.timers.tick(1500);
  hear("Priya", "Q3 board numbers", "ignored until the next question");
  mock.timers.tick(1500);
  assert.deepEqual(answers, ["Priya", "Q3 board numbers"]);
  mock.timers.reset();
});

test("hands-free: restarts when the browser ends the session, keeping what was heard", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { s, rec, hear, answers } = session(true);
  s.openWindow();
  hear("Priya");
  rec.onend?.(); // the browser stopped listening mid-answer
  assert.deepEqual(answers, ["Priya"]);
  assert.equal(rec.starts, 2);
  rec.onstart?.();
  s.openWindow();
  hear("Tom"); // a fresh session starts its words again
  mock.timers.tick(1500);
  assert.deepEqual(answers, ["Priya", "Tom"]);
  mock.timers.reset();
});

test("not allowed: says so and stops", () => {
  const { rec, problems } = session(true);
  rec.onerror?.({ error: "not-allowed" });
  assert.equal(problems.length, 1);
  assert.equal(rec.aborts, 1);
  rec.onend?.();
  assert.equal(rec.starts, 1); // no restart after a stop
});
