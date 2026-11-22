// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { BUNDLED_BANK_HOLIDAYS, describeBankHoliday, fromGovUk, isBankHolidayList } from "./bank-holidays.ts";

// The shape of https://www.gov.uk/bank-holidays.json (checked 22 Nov 2026), cut down.
const FEED = {
  "england-and-wales": {
    division: "england-and-wales",
    events: [
      { title: "Christmas Day", date: "2026-12-25", notes: "", bunting: true },
      { title: "Boxing Day", date: "2026-12-28", notes: "Substitute day", bunting: true },
    ],
  },
  scotland: { division: "scotland", events: [{ title: "2nd January", date: "2027-01-04", notes: "Substitute day", bunting: true }] },
};

test("fromGovUk: takes England & Wales from the feed", () => {
  assert.deepEqual(fromGovUk(FEED), [
    { date: "2026-12-25", title: "Christmas Day" },
    { date: "2026-12-28", title: "Boxing Day", notes: "Substitute day" },
  ]);
});

test("fromGovUk: anything unexpected gives an empty list, so the built-in one stays", () => {
  for (const bad of [null, {}, { "england-and-wales": {} }, { "england-and-wales": { events: [{ date: "soon", title: "x" }] } }, "<html>"])
    assert.deepEqual(fromGovUk(bad), []);
});

test("isBankHolidayList", () => {
  assert.equal(isBankHolidayList(BUNDLED_BANK_HOLIDAYS), true);
  assert.equal(isBankHolidayList([]), false);
  assert.equal(isBankHolidayList([{ date: "2026-12-25" }]), false);
  assert.equal(isBankHolidayList("2026-12-25"), false);
});

test("describeBankHoliday reads well in a sentence", () => {
  assert.equal(describeBankHoliday({ date: "2026-12-25", title: "Christmas Day" }), "Christmas Day");
  assert.equal(describeBankHoliday({ date: "2026-05-04", title: "Early May bank holiday" }), "the Early May bank holiday");
  assert.equal(describeBankHoliday({ date: "2026-12-28", title: "Boxing Day", notes: "Substitute day" }), "the substitute day for Boxing Day");
});

test("the built-in list is in date order with no repeats", () => {
  const dates = BUNDLED_BANK_HOLIDAYS.map((h) => h.date);
  assert.deepEqual(dates, [...new Set(dates)].sort());
});
