// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { isBack, isNoOne, isSkip, splitNames, yesOrNo } from "./voice-answers.ts";

test("skipping an optional question (decision 37)", () => {
  for (const s of ["skip", "Skip.", "skip it", "pass", "nothing", "None", "no"]) assert.equal(isSkip(s), true, s);
  for (const s of ["no one knows the numbers", "skip the intro and send the totals", "the board wants it"])
    assert.equal(isSkip(s), false, s);
});

test("yes or no to 'Another action?'", () => {
  for (const yes of ["yes", "Yeah.", "yes please", "another one", "one more", "OK"]) assert.equal(yesOrNo(yes), "yes", yes);
  for (const no of ["no", "No, that's everything", "nope", "that’s all", "that's it", "I'm done", "nothing else"])
    assert.equal(yesOrNo(no), "no", no);
  for (const unclear of ["", "Priya", "banana"]) assert.equal(yesOrNo(unclear), null, unclear);
});

test("no one to copy in", () => {
  for (const none of ["no", "No one.", "nobody", "none", "no thanks"]) assert.equal(isNoOne(none), true, none);
  for (const someone of ["Tom", "Tom and Priya"]) assert.equal(isNoOne(someone), false, someone);
});

test("splitting names", () => {
  assert.deepEqual(splitNames("Tom"), ["tom"]);
  assert.deepEqual(splitNames("Tom and Priya"), ["tom", "priya"]);
  assert.deepEqual(splitNames("copy in Tom, Priya & Sam."), ["tom", "priya", "sam"]);
  assert.deepEqual(splitNames("Mary Jane plus Tom"), ["mary jane", "tom"]);
});

test("back", () => {
  assert.equal(isBack("back"), true);
  assert.equal(isBack("Go back."), true);
  assert.equal(isBack("back to the drawing board"), false);
});
