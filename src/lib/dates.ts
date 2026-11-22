// Deadline rules from DispatchSpec.md §7, for Phase 1 (bank holidays come in Phase 2). Works in the
// device's own time zone, which is UK time for Dispatch's one user.

export type Deadline =
  | { kind: "ok"; at: Date; moved?: string } // moved: why the day changed (a weekend)
  | { kind: "past"; at: Date }
  | { kind: "vague" }
  | { kind: "unknown" };

/** "End of day", and the time used when a deadline has a date but no time (§7). */
export const END_OF_DAY = { hour: 17, minute: 30 };

const WEEKDAY_NUMBERS: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tues: 2, tue: 2, wednesday: 3, wed: 3,
  thursday: 4, thurs: 4, thur: 4, thu: 4, friday: 5, fri: 5, saturday: 6, sat: 6,
};
const MONTH_NUMBERS: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3, may: 4, june: 5, jun: 5,
  july: 6, jul: 6, august: 7, aug: 7, september: 8, sept: 8, sep: 8, october: 9, oct: 9,
  november: 10, nov: 10, december: 11, dec: 11,
};
const COUNT_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  "a couple of": 2, "couple of": 2,
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const WEEKDAY = "(monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat|sunday|sun)";
const MONTH =
  "(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)";
const COUNT = "(\\d+|a couple of|couple of|an|a|one|two|three|four|five|six|seven|eight|nine|ten)";

// Asked about rather than guessed (§7): "soon", "ASAP", "when you can"…
const VAGUE =
  /\b(soon|asap|a\.s\.a\.p|as soon as (you can|possible)|when(ever)? you (can|get a chance)|when possible|no rush|sometime|some time|shortly|urgent(ly)?|later|in due course|next week|this month|next month)\b/;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const atTime = (d: Date, hour: number, minute: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute);
/** Monday of the week containing d (weeks start on Monday). */
const mondayOf = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
const count = (word: string) => COUNT_WORDS[word] ?? Number(word);

/** Monday to Friday. Bank holidays are added in Phase 2. */
export function isWorkingDay(d: Date) {
  return d.getDay() !== 0 && d.getDay() !== 6;
}

function addWorkingDays(d: Date, n: number) {
  let day = startOfDay(d);
  for (let left = n; left > 0; ) {
    day = addDays(day, 1);
    if (isWorkingDay(day)) left--;
  }
  return day;
}

/** A real calendar date, or null for things like 31 February. */
function makeDate(year: number, month: number, day: number) {
  const d = new Date(year, month, day);
  return d.getMonth() === month && d.getDate() === day ? d : null;
}

/** A day and month with no year: this year, or next year if that's more than a month ago. */
function dayMonth(today: Date, month: number, day: number, year?: number) {
  if (year !== undefined) return makeDate(year, month, day);
  const thisYear = makeDate(today.getFullYear(), month, day);
  if (thisYear && today.getTime() - thisYear.getTime() > 31 * 86_400_000) return makeDate(today.getFullYear() + 1, month, day);
  return thisYear;
}

/** Works out a deadline from what you said or typed, following §7. */
export function parseDeadline(input: string, now: Date = new Date()): Deadline {
  let s = ` ${input.toLowerCase().replace(/[,!?]/g, " ").replace(/\s+/g, " ").trim()} `;
  const today = startOfDay(now);
  let m: RegExpMatchArray | null;

  // Time of day, if one was given.
  let time: { hour: number; minute: number } | null = null;
  if ((m = s.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/)) || (m = s.match(/\b(\d{1,2}):(\d{2})\b/))) {
    let hour = Number(m[1]);
    const minute = Number(m[2] ?? 0);
    const half = m[3]?.replace(/\./g, "");
    if (half === "pm" && hour < 12) hour += 12;
    if (half === "am" && hour === 12) hour = 0;
    if (hour <= 23 && minute <= 59) {
      time = { hour, minute };
      s = s.replace(m[0], " ");
    }
  } else if (/\b(noon|midday|lunchtime)\b/.test(s)) {
    time = { hour: 12, minute: 0 };
  }
  const endOfDay = /\b(end of (the )?day|eod|close of (play|business)|cob|cop)\b/.test(s);

  // The day.
  let day: Date | null = null;
  if (/\bend of next week\b/.test(s)) {
    day = addDays(mondayOf(today), 7 + 4);
  } else if (/\b(end of (the |this )?week|eow|this week|by the weekend)\b/.test(s)) {
    const friday = addDays(mondayOf(today), 4);
    day = friday < today ? addDays(friday, 7) : friday;
  } else if ((m = s.match(new RegExp(`\\bin ${COUNT} (working |business )?days?\\b`)))) {
    day = addWorkingDays(today, count(m[1])); // relative deadlines skip weekends (§7)
  } else if ((m = s.match(new RegExp(`\\bin ${COUNT} weeks?\\b`)))) {
    day = addDays(today, 7 * count(m[1]));
  } else if (/\bin a fortnight\b/.test(s)) {
    day = addDays(today, 14);
  } else if (/\b(today|tonight|this (morning|afternoon|evening))\b/.test(s)) {
    day = today;
  } else if (/\btomorrow\b/.test(s)) {
    day = addDays(today, 1);
  } else if ((m = s.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?(?: of)? ${MONTH}\\b(?: (\\d{4}))?`)))) {
    day = dayMonth(today, MONTH_NUMBERS[m[2]], Number(m[1]), m[3] ? Number(m[3]) : undefined);
  } else if ((m = s.match(new RegExp(`\\b${MONTH} (\\d{1,2})(?:st|nd|rd|th)?\\b(?: (\\d{4}))?`)))) {
    day = dayMonth(today, MONTH_NUMBERS[m[1]], Number(m[2]), m[3] ? Number(m[3]) : undefined);
  } else if ((m = s.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?\b/))) {
    const year = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : undefined;
    day = dayMonth(today, Number(m[2]) - 1, Number(m[1]), year);
  } else if ((m = s.match(new RegExp(`\\b(?:(next|this) )?${WEEKDAY}\\b`)))) {
    const target = WEEKDAY_NUMBERS[m[2]];
    if (m[1] === "next") day = addDays(mondayOf(today), 7 + ((target + 6) % 7)); // that day next week
    else if (m[1] === "this") day = addDays(mondayOf(today), (target + 6) % 7); // that day this week
    else day = addDays(today, (target - today.getDay() + 7) % 7); // the next one, today included
  } else if ((m = s.match(/\b(\d{1,2})(?:st|nd|rd|th)\b/))) {
    // "the 25th": this month, or next month if it has passed.
    const dayOfMonth = Number(m[1]);
    const thisMonth = makeDate(today.getFullYear(), today.getMonth(), dayOfMonth);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1); // rolls December over to January
    day = thisMonth && thisMonth >= today ? thisMonth : makeDate(nextMonth.getFullYear(), nextMonth.getMonth(), dayOfMonth);
  } else if (endOfDay || time) {
    day = today;
  }

  if (!day) return VAGUE.test(s) ? { kind: "vague" } : { kind: "unknown" };

  const at = atTime(day, time?.hour ?? END_OF_DAY.hour, time?.minute ?? END_OF_DAY.minute);
  if (at.getTime() < now.getTime()) return { kind: "past", at };
  if (isWorkingDay(at)) return { kind: "ok", at };

  // A weekend moves to the next working day at 17:30, flagged (§7).
  let next = addDays(at, 1);
  while (!isWorkingDay(next)) next = addDays(next, 1);
  return {
    kind: "ok",
    at: atTime(next, END_OF_DAY.hour, END_OF_DAY.minute),
    moved: `${formatDay(at)} is a weekend, so it's moved to the next working day`,
  };
}

/** e.g. "Fri 21 Nov" (§6: always the actual day and date). */
export function formatDay(d: Date) {
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

/** e.g. "17:30, Fri 21 Nov". */
export function formatDeadline(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}, ${formatDay(d)}`;
}
