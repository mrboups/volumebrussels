import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

export const BRUSSELS_TZ = "Europe/Brussels";

/**
 * Convert a datetime-local input string ("YYYY-MM-DDTHH:mm")
 * interpreted as Brussels time into a UTC Date object.
 */
export function parseBrusselsDatetimeLocal(input: string): Date {
  // Treat the naive local string as if it were in Brussels TZ
  return fromZonedTime(input, BRUSSELS_TZ);
}

/**
 * Format a Date (UTC) as "YYYY-MM-DDTHH:mm" in Brussels time
 * for use in datetime-local inputs.
 */
export function formatBrusselsDatetimeLocal(date: Date): string {
  return formatInTimeZone(date, BRUSSELS_TZ, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Format a Date as "DD/MM/YYYY" in Brussels time
 */
export function formatBrusselsDate(date: Date): string {
  return formatInTimeZone(date, BRUSSELS_TZ, "dd/MM/yyyy");
}

/**
 * Format a Date as "HH:mm" in Brussels time
 */
export function formatBrusselsTime(date: Date): string {
  return formatInTimeZone(date, BRUSSELS_TZ, "HH:mm");
}

/**
 * Full readable format in Brussels time: "Sat, 11 Apr 2026 22:00"
 */
export function formatBrusselsFull(date: Date): string {
  return formatInTimeZone(date, BRUSSELS_TZ, "EEE, d MMM yyyy HH:mm");
}

/**
 * Convert a Brussels zoned date to a UTC Date (for storing in DB)
 */
export function brusselsToUtc(date: Date): Date {
  return fromZonedTime(date, BRUSSELS_TZ);
}

/**
 * Convert a UTC date to a Brussels-zoned Date (raw number display)
 */
export function utcToBrussels(date: Date): Date {
  return toZonedTime(date, BRUSSELS_TZ);
}

/**
 * Get the cutoff date for "visible events":
 * An event on day D is visible until 02:00 Brussels on day D+1.
 * Returns a Date that can be used as `where: { date: { gte: cutoff } }`.
 */
export function getVisibilityCutoff(): Date {
  // Shift now by -2h, then snap to start of that Brussels day
  const shifted = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const dayStr = formatInTimeZone(shifted, BRUSSELS_TZ, "yyyy-MM-dd");
  return fromZonedTime(`${dayStr}T00:00:00`, BRUSSELS_TZ);
}
