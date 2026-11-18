// The TypeScript twin of app/services/formula/duration.rb: same input rules, same canonical
// text ("35 mins", "1 hr 30 mins", "1 day 3 hrs"). Both read spec/fixtures/files/duration/cases.json,
// so change the rules and the fixture together.

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const UNIT_SECONDS: Record<string, number> = {
  s: 1, sec: 1, secs: 1, second: 1, seconds: 1,
  m: MINUTE, min: MINUTE, mins: MINUTE, minute: MINUTE, minutes: MINUTE,
  h: HOUR, hr: HOUR, hrs: HOUR, hour: HOUR, hours: HOUR,
  d: DAY, day: DAY, days: DAY,
  w: 7 * DAY, wk: 7 * DAY, wks: 7 * DAY, week: 7 * DAY, weeks: 7 * DAY,
  mo: 30 * DAY, mos: 30 * DAY, month: 30 * DAY, months: 30 * DAY,
  y: 365 * DAY, yr: 365 * DAY, yrs: 365 * DAY, year: 365 * DAY, years: 365 * DAY,
};

// Units a duration rolls up to, largest first. It never rolls up past days.
const ROLL_UP: [number, string, string][] = [
  [DAY, "day", "days"],
  [HOUR, "hr", "hrs"],
  [MINUTE, "min", "mins"],
  [1, "sec", "secs"],
];

const NUMBER = "\\d+(?:[.,]\\d+)?";
const CLOCK = /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/;
const BARE_NUMBER = new RegExp(`^(${NUMBER})$`);
const TERMS = new RegExp(`^(?:\\s*(?:,|and\\b)?\\s*${NUMBER}\\s*[a-z]+)+\\s*$`);
const TERM = new RegExp(`(${NUMBER})\\s*([a-z]+)`, "g");

const toNumber = (text: string) => Number(text.replace(",", "."));

function parseClock(text: string): number | null {
  const match = CLOCK.exec(text);
  if (!match) return null;

  const [hours, minutes, seconds] = [match[1], match[2], match[3]].map((part) => Number(part ?? 0));
  if (minutes >= 60 || seconds >= 60) return null;

  return hours * HOUR + minutes * MINUTE + seconds;
}

function parseBareNumber(text: string): number | null {
  const match = BARE_NUMBER.exec(text);
  return match ? Math.round(toNumber(match[1]) * MINUTE) : null;
}

function parseTerms(text: string): number | null {
  if (!TERMS.test(text)) return null;

  const terms = [...text.matchAll(TERM)];
  if (!terms.every(([, , unit]) => unit in UNIT_SECONDS)) return null;

  return Math.round(terms.reduce((sum, [, amount, unit]) => sum + toNumber(amount) * UNIT_SECONDS[unit], 0));
}

// Whole seconds, or null for text that is not a duration. A bare number means minutes.
export function parseDuration(input: string): number | null {
  let text = input.trim().toLowerCase();
  const sign = text.startsWith("-") ? -1 : 1;
  text = text.replace(/^[-+]\s*/, "");
  if (text === "") return null;

  const seconds = parseClock(text) ?? parseBareNumber(text) ?? parseTerms(text);
  // Ruby has bignums; here a total past 2^53 would lose precision and print as "1e+21 days".
  if (seconds === null || !Number.isSafeInteger(seconds)) return null;

  return sign * seconds;
}

export function formatDuration(totalSeconds: number): string {
  let remaining = Math.abs(totalSeconds);
  const parts: string[] = [];

  for (const [size, singular, plural] of ROLL_UP) {
    const count = Math.floor(remaining / size);
    remaining -= count * size;
    if (count > 0) parts.push(`${count} ${count === 1 ? singular : plural}`);
  }

  if (parts.length === 0) return "0 mins";

  return `${totalSeconds < 0 ? "-" : ""}${parts.join(" ")}`;
}

// The canonical text for what a user typed, or null when it is not a duration.
export function normalizeDuration(input: string): string | null {
  const seconds = parseDuration(input);
  return seconds === null ? null : formatDuration(seconds);
}
