// Small date helpers shared by the services. Everything is UTC ISO 8601.

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

/** Normalises any ISO datetime to the `toISOString()` form the db stores. */
export function toUtcIso(value: string): string {
  return new Date(value).toISOString();
}

export function minutesBetween(startsAt: string, endsAt: string): number {
  return (Date.parse(endsAt) - Date.parse(startsAt)) / MS_PER_MINUTE;
}

/** Midnight UTC at the start of the day `iso` falls on, and the next one. */
export function utcDayBounds(iso: string): { end: string; start: string } {
  const start = new Date(iso);
  start.setUTCHours(0, 0, 0, 0);
  return {
    end: new Date(start.getTime() + MS_PER_DAY).toISOString(),
    start: start.toISOString(),
  };
}
