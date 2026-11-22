// Keeps the app's bank holidays up to date (DispatchSpec.md §7: "cached and refreshed weekly"). The list last
// fetched is saved on the device and used straight away; once it's a week old, the latest is fetched from
// /api/bank-holidays (which gets it from gov.uk). If anything fails, the list in use stays as it is.
import { isBankHolidayList } from "./bank-holidays.ts";
import { setBankHolidays } from "./dates.ts";
import { readLocal, writeLocal } from "./local.ts";

const KEY = "dispatch-bank-holidays-v1";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type Saved = { checkedAt: number; holidays: unknown };

export function refreshBankHolidays() {
  const saved = readLocal<Saved | null>(KEY, null);
  if (saved && isBankHolidayList(saved.holidays)) {
    setBankHolidays(saved.holidays);
    if (Date.now() - saved.checkedAt < WEEK_MS) return;
  }
  fetch("/api/bank-holidays")
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { source?: string; holidays?: unknown } | null) => {
      // Only gov.uk's list is saved; the server's built-in fallback means "try again next time".
      if (data?.source !== "gov.uk" || !isBankHolidayList(data.holidays)) return;
      setBankHolidays(data.holidays);
      writeLocal(KEY, { checkedAt: Date.now(), holidays: data.holidays });
    })
    .catch(() => {
      /* offline or the server is down: keep the list in use */
    });
}
