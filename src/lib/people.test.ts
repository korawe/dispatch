// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanDetails, displayName, matchPeople, nameAsHeard, parseAka, withAka, type Person } from "./people.ts";

const priya: Person = { id: "p", name: "Priya", email: "priya@example.com", fullName: "Priya Patel", role: "EA", aka: ["Pree", "Maria"] };
const tomJ: Person = { id: "tj", name: "Tom", email: "tom.j@example.com", fullName: "Tom Jones", role: "Head of Ops" };
const tomS: Person = { id: "ts", name: "Tom", email: "tom.s@example.com", fullName: "Tom Smith" };
const bob: Person = { id: "b", name: "Bob", email: "bob@example.com", active: false };
const people = [priya, tomJ, tomS, bob];
const ids = (said: string, list = people) => matchPeople(list, said).map((p) => p.id);

test("matching: name, full name and also known as", () => {
  assert.deepEqual(ids("Priya"), ["p"]);
  assert.deepEqual(ids("priya patel"), ["p"]);
  assert.deepEqual(ids("Maria."), ["p"]); // how speech recognition heard her
  assert.deepEqual(ids("Pree"), ["p"]);
  assert.deepEqual(ids("Pri"), ["p"]); // part of a name
});

test("matching: two Toms — 'Tom' asks, a full name or surname picks one (§4)", () => {
  assert.deepEqual(ids("Tom"), ["tj", "ts"]);
  assert.deepEqual(ids("Tom Jones"), ["tj"]);
  assert.deepEqual(ids("Smith"), ["ts"]);
  assert.deepEqual(ids("it's Tom Smith"), ["ts"]);
});

test("matching: people you no longer delegate to are left out", () => {
  assert.deepEqual(ids("Bob"), []);
  assert.deepEqual(ids(""), []);
  assert.deepEqual(ids("Zed"), []);
});

test("matching still works for lists saved before Phase 2 (name and email only)", () => {
  const old: Person[] = [{ id: "1", name: "Priya", email: "p@example.com" }, { id: "2", name: "Tom", email: "t@example.com" }];
  assert.deepEqual(ids("priya", old), ["1"]);
  assert.deepEqual(ids("copy Tom", old), ["2"]);
});

test("filler words around a name don't count", () => {
  assert.equal(nameAsHeard("it's maria please"), "Maria");
  assert.equal(nameAsHeard("give it to Tom Smith"), "Tom Smith");
  // An "also known as" learned from speech can't make "it's" match someone.
  const taught = withAka(priya, "It's Maria");
  assert.deepEqual(ids("it's Tom Jones", [taught, tomJ, tomS]), ["tj"]);
});

test("displayName: only says more when two current delegates share a name", () => {
  assert.equal(displayName(priya, people), "Priya");
  assert.equal(displayName(tomJ, people), "Tom Jones");
  assert.equal(displayName({ ...tomS, fullName: undefined, role: "Finance" }, [tomJ, { ...tomS, fullName: undefined }]), "Tom (Finance)");
  assert.equal(displayName({ ...tomS, fullName: undefined }, [tomJ, tomS]), "Tom (tom.s@example.com)");
  assert.equal(displayName(tomJ, [tomJ, { ...tomS, active: false }]), "Tom"); // the other Tom has left
});

test("also known as: parsed from a comma list, no repeats; added to one at a time", () => {
  assert.deepEqual(parseAka(" Pree,  maria , PREE,, "), ["Pree", "maria"]);
  assert.deepEqual(withAka(priya, "Prea").aka, ["Pree", "Maria", "Prea"]);
  assert.deepEqual(withAka(priya, "maria").aka, ["Pree", "Maria"]);
});

test("cleanDetails: trims and leaves out empty optional fields", () => {
  assert.deepEqual(cleanDetails({ name: "  Priya  ", email: " p@example.com ", fullName: " ", role: "", aka: [], active: true }), {
    name: "Priya",
    email: "p@example.com",
  });
  assert.deepEqual(cleanDetails({ name: "Bob", email: "b@example.com", active: false }), { name: "Bob", email: "b@example.com", active: false });
});
