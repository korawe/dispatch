import { cacheLife } from "next/cache";
import { BUNDLED_BANK_HOLIDAYS, fromGovUk } from "@/lib/bank-holidays";

// England & Wales bank holidays for the deadline rules (DispatchSpec.md §7), from the gov.uk feed. The answer is
// cached for a week (the spec's "refreshed weekly"), so gov.uk is asked at most about once a week. If gov.uk
// can't be reached, the built-in list is sent with source "bundled", and the app tries again next time.

async function govUkBankHolidays() {
  "use cache";
  cacheLife("weeks");
  const res = await fetch("https://www.gov.uk/bank-holidays.json");
  if (!res.ok) throw new Error(`gov.uk answered ${res.status}`);
  const holidays = fromGovUk(await res.json());
  if (!holidays.length) throw new Error("no England and Wales bank holidays in gov.uk's answer");
  return holidays;
}

export async function GET() {
  try {
    return Response.json({ source: "gov.uk", holidays: await govUkBankHolidays() });
  } catch (err) {
    console.error("Bank holidays: couldn't get the gov.uk list, sending the built-in one.", err instanceof Error ? err.message : err);
    return Response.json({ source: "bundled", holidays: BUNDLED_BANK_HOLIDAYS });
  }
}
