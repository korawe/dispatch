// England & Wales bank holidays (DispatchSpec.md §7), from the gov.uk feed: https://www.gov.uk/bank-holidays.json
// A copy is built in, so deadlines are right from the first launch and offline. The app refreshes it weekly
// through /api/bank-holidays (see bank-holidays-refresh.ts), which picks up any new or one-off bank holiday.

export type BankHoliday = { date: string; title: string; notes?: string }; // date: "YYYY-MM-DD"

/** The gov.uk list for England & Wales, as published on 22 Nov 2026 (it ran to the end of 2028). */
export const BUNDLED_BANK_HOLIDAYS: BankHoliday[] = [
  { date: "2026-01-01", title: "New Year’s Day" },
  { date: "2026-04-03", title: "Good Friday" },
  { date: "2026-04-06", title: "Easter Monday" },
  { date: "2026-05-04", title: "Early May bank holiday" },
  { date: "2026-05-25", title: "Spring bank holiday" },
  { date: "2026-08-31", title: "Summer bank holiday" },
  { date: "2026-12-25", title: "Christmas Day" },
  { date: "2026-12-28", title: "Boxing Day", notes: "Substitute day" },
  { date: "2027-01-01", title: "New Year’s Day" },
  { date: "2027-03-26", title: "Good Friday" },
  { date: "2027-03-29", title: "Easter Monday" },
  { date: "2027-05-03", title: "Early May bank holiday" },
  { date: "2027-05-31", title: "Spring bank holiday" },
  { date: "2027-08-30", title: "Summer bank holiday" },
  { date: "2027-12-27", title: "Christmas Day", notes: "Substitute day" },
  { date: "2027-12-28", title: "Boxing Day", notes: "Substitute day" },
  { date: "2028-01-03", title: "New Year’s Day", notes: "Substitute day" },
  { date: "2028-04-14", title: "Good Friday" },
  { date: "2028-04-17", title: "Easter Monday" },
  { date: "2028-05-01", title: "Early May bank holiday" },
  { date: "2028-05-29", title: "Spring bank holiday" },
  { date: "2028-08-28", title: "Summer bank holiday" },
  { date: "2028-12-25", title: "Christmas Day" },
  { date: "2028-12-26", title: "Boxing Day" },
];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A list of bank holidays that looks right (from storage or the server). */
export function isBankHolidayList(x: unknown): x is BankHoliday[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    x.every((h) => h && typeof h === "object" && DATE.test(h.date) && typeof h.title === "string" && h.title.trim() !== "")
  );
}

/** The England & Wales list from the gov.uk feed's JSON, or [] if it isn't in the expected shape. */
export function fromGovUk(json: unknown, region = "england-and-wales"): BankHoliday[] {
  const events = (json as Record<string, { events?: unknown }> | null)?.[region]?.events;
  if (!Array.isArray(events)) return [];
  const list = events
    .filter((e) => e && DATE.test(e.date) && typeof e.title === "string" && e.title.trim())
    .map((e): BankHoliday => ({ date: e.date, title: e.title.trim(), ...(e.notes ? { notes: String(e.notes) } : {}) }));
  return isBankHolidayList(list) ? list : [];
}

/** How a bank holiday is named in a sentence: "Christmas Day", "the Early May bank holiday", "the substitute day for Boxing Day". */
export function describeBankHoliday(h: BankHoliday) {
  if (/substitute/i.test(h.notes ?? "")) return `the substitute day for ${h.title}`;
  return /bank holiday$/i.test(h.title) ? `the ${h.title}` : h.title;
}
