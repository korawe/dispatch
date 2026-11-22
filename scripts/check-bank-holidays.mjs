// Does the bank holiday list built into the app (src/lib/bank-holidays.ts) match gov.uk's live feed? Run it when
// gov.uk publishes another year, then copy any new dates into BUNDLED_BANK_HOLIDAYS.
// Usage: npm run check:bank-holidays
const { BUNDLED_BANK_HOLIDAYS, fromGovUk } = await import(new URL("../src/lib/bank-holidays.ts", import.meta.url).href);

const from = BUNDLED_BANK_HOLIDAYS[0].date;
const live = fromGovUk(await (await fetch("https://www.gov.uk/bank-holidays.json")).json()).filter((h) => h.date >= from);
const builtIn = JSON.stringify(BUNDLED_BANK_HOLIDAYS);
if (builtIn === JSON.stringify(live)) {
  console.log(`Up to date: ${live.length} bank holidays, ${live[0].date} to ${live.at(-1).date}.`);
} else {
  const known = new Set(BUNDLED_BANK_HOLIDAYS.map((h) => JSON.stringify(h)));
  const now = new Set(live.map((h) => JSON.stringify(h)));
  console.log("Different from gov.uk.");
  console.log("On gov.uk, not built in:", live.filter((h) => !known.has(JSON.stringify(h))));
  console.log("Built in, not on gov.uk:", BUNDLED_BANK_HOLIDAYS.filter((h) => !now.has(JSON.stringify(h))));
  process.exitCode = 1;
}
