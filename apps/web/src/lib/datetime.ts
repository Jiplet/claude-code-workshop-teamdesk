// Every date the UI shows is UTC and built by slicing ISO strings, so the
// Worker and the browser render the same text. `toLocaleString()` would differ
// by locale and timezone and cause a hydration mismatch.

/** "2026-10-20T09:30:00.000Z" -> "2026-10-20 09:30 UTC" */
export function formatUtc(iso: string): string {
  return `${iso.slice(0, 16).replace("T", " ")} UTC`;
}

/** "2026-10-20T09:30:00.000Z" -> "09:30" */
export function formatUtcTime(iso: string): string {
  return iso.slice(11, 16);
}

/** "09:30 to 10:00 UTC", with the end day added when it differs. */
export function formatUtcRange(startIso: string, endIso: string): string {
  const sameDay = startIso.slice(0, 10) === endIso.slice(0, 10);
  const end = sameDay ? formatUtcTime(endIso) : formatUtc(endIso);
  return `${formatUtcTime(startIso)} to ${sameDay ? `${end} UTC` : end}`;
}

/** Today's date in UTC, YYYY-MM-DD. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** ("2026-10-20", "09:30") -> "2026-10-20T09:30:00.000Z" */
export function isoFromDayAndTime(day: string, time: string): string {
  return new Date(`${day}T${time}:00.000Z`).toISOString();
}

// The helpers below use the browser's timezone. Call them only on the client
// (in effects or handlers), never during the server render.

/** The browser's local day: its UTC bounds [dayStart, dayEnd) and its date. */
export function localDayBounds(now: Date = new Date()): {
  dayEnd: string;
  dayStart: string;
  today: string;
} {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    dayEnd: end.toISOString(),
    dayStart: start.toISOString(),
    today: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
  };
}

/** "2026-10-20T22:30:00.000Z" -> "09:30" in the browser's timezone. */
export function formatLocalTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
