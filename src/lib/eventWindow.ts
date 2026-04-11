/**
 * Event ticket swipe window rules.
 *
 * A ticket can only be validated ("swiped") inside a specific window
 * around the event's Brussels calendar day. Outside the window, the
 * /api/tickets/validate endpoint rejects the swipe, and tickets whose
 * close time has passed without being used are auto-flipped to
 * `expired` (either lazily on the rejected swipe attempt or by the
 * /api/cron sweep).
 *
 * Rule (mirrors the night pass expiry semantics):
 *
 *   - Event on FRIDAY  → window is Fri 18:00 → Sat 11:00 Brussels
 *   - Event on SATURDAY → window is Sat 18:00 → Mon 02:00 Brussels
 *   - Event on any other day → window is eventDay 18:00 → nextDay 06:00
 *     (fallback, not expected to be common — most events are Fri/Sat)
 *
 * These times are in Brussels local time; the function returns UTC
 * Date objects so they can be compared against `new Date()` directly.
 */

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const TZ = "Europe/Brussels";

export interface TicketWindow {
  opens: Date; // UTC
  closes: Date; // UTC
}

/** Build a Brussels-zoned datetime offset from the event's Brussels calendar day. */
function brusselsOffset(
  eventDate: Date,
  daysOffset: number,
  targetHour: number
): Date {
  const eventDayStr = formatInTimeZone(eventDate, TZ, "yyyy-MM-dd");
  const midnightUtc = fromZonedTime(`${eventDayStr}T00:00:00`, TZ);
  const offsetUtc = new Date(
    midnightUtc.getTime() + daysOffset * 24 * 60 * 60 * 1000
  );
  const targetDayStr = formatInTimeZone(offsetUtc, TZ, "yyyy-MM-dd");
  const hh = String(targetHour).padStart(2, "0");
  return fromZonedTime(`${targetDayStr}T${hh}:00:00`, TZ);
}

/**
 * Compute the swipe window for a ticket whose event takes place on
 * `eventDate` (a UTC Date, as stored on `Event.date`).
 */
export function computeTicketSwipeWindow(eventDate: Date): TicketWindow {
  // ISO weekday of the event's Brussels day: Mon=1..Sun=7
  const isoDay = parseInt(formatInTimeZone(eventDate, TZ, "i"), 10);

  const opens = brusselsOffset(eventDate, 0, 18); // event day 18:00 Brussels

  let closes: Date;
  if (isoDay === 5) {
    // Friday → Saturday 11:00 Brussels
    closes = brusselsOffset(eventDate, 1, 11);
  } else if (isoDay === 6) {
    // Saturday → Monday 02:00 Brussels
    closes = brusselsOffset(eventDate, 2, 2);
  } else {
    // Fallback: next day 06:00 Brussels
    closes = brusselsOffset(eventDate, 1, 6);
  }

  return { opens, closes };
}

/** True if `now` is strictly before the window opens. */
export function isBeforeTicketWindow(eventDate: Date, now: Date): boolean {
  const { opens } = computeTicketSwipeWindow(eventDate);
  return now < opens;
}

/** True if `now` is strictly after the window closes. */
export function isAfterTicketWindow(eventDate: Date, now: Date): boolean {
  const { closes } = computeTicketSwipeWindow(eventDate);
  return now > closes;
}

/** True if the swipe window is currently open for this event. */
export function isWithinTicketWindow(eventDate: Date, now: Date): boolean {
  const { opens, closes } = computeTicketSwipeWindow(eventDate);
  return now >= opens && now <= closes;
}

/** Format window bounds in Brussels time for error messages. */
export function formatWindowForHuman(win: TicketWindow): {
  opens: string;
  closes: string;
} {
  const fmt = (d: Date) =>
    formatInTimeZone(d, TZ, "EEE d MMM HH:mm") + " Brussels";
  return {
    opens: fmt(win.opens),
    closes: fmt(win.closes),
  };
}
