/**
 * Period selection helpers for the accounting dashboard. Every
 * metric on that page either uses "all time" (no filter) or a date
 * range parsed from URL query params.
 *
 * Two recognized shapes:
 *   - ?period=all                         → open-ended
 *   - ?period=ytd                         → year-to-date
 *   - ?period=this-quarter                → current quarter of current year
 *   - ?period=last-quarter                → previous quarter
 *   - ?period=q<1|2|3|4>-<year>           → specific quarter (e.g. q2-2026)
 *   - ?from=YYYY-MM-DD&to=YYYY-MM-DD      → custom range (inclusive of from, exclusive of to+1)
 *
 * The resolved period is either { from: Date, to: Date } (closed-open)
 * or null, meaning "all time".
 */

export type Period = { from: Date; to: Date } | null;

export interface PeriodChoice {
  key: string;
  label: string;
}

/** Return the current quarter of the current year (1..4). */
export function currentQuarter(now = new Date()): { quarter: number; year: number } {
  return {
    quarter: Math.floor(now.getMonth() / 3) + 1,
    year: now.getFullYear(),
  };
}

/** Return the start (inclusive) and end (exclusive) of a given quarter. */
export function quarterRange(quarter: number, year: number): { from: Date; to: Date } {
  const startMonth = (quarter - 1) * 3;
  const from = new Date(year, startMonth, 1, 0, 0, 0, 0);
  const to = new Date(year, startMonth + 3, 1, 0, 0, 0, 0);
  return { from, to };
}

/** Shift a quarter by a number of quarters (negative = earlier). */
export function shiftQuarter(
  quarter: number,
  year: number,
  delta: number
): { quarter: number; year: number } {
  let q = quarter - 1 + delta;
  let y = year;
  while (q < 0) {
    q += 4;
    y -= 1;
  }
  while (q > 3) {
    q -= 4;
    y += 1;
  }
  return { quarter: q + 1, year: y };
}

/** Parse URL search params into a resolved period. */
export function parsePeriod(params: URLSearchParams | Record<string, string | undefined>): Period {
  const get = (k: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(k) ?? undefined;
    return params[k];
  };

  const from = get("from");
  const to = get("to");
  if (from && to) {
    const f = new Date(from + "T00:00:00");
    const t = new Date(to + "T00:00:00");
    t.setDate(t.getDate() + 1); // include the `to` day
    if (!Number.isNaN(f.getTime()) && !Number.isNaN(t.getTime())) {
      return { from: f, to: t };
    }
  }

  const period = get("period") ?? "all";
  const now = new Date();
  const cur = currentQuarter(now);

  if (period === "all") return null;
  if (period === "ytd") {
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear() + 1, 0, 1),
    };
  }
  if (period === "this-quarter") return quarterRange(cur.quarter, cur.year);
  if (period === "last-quarter") {
    const { quarter, year } = shiftQuarter(cur.quarter, cur.year, -1);
    return quarterRange(quarter, year);
  }

  const quarterMatch = period.match(/^q([1-4])-(\d{4})$/);
  if (quarterMatch) {
    return quarterRange(parseInt(quarterMatch[1], 10), parseInt(quarterMatch[2], 10));
  }

  return null;
}

/** A human-readable label for the resolved period. */
export function formatPeriodLabel(period: Period): string {
  if (period === null) return "All time";
  const from = period.from;
  const toInclusive = new Date(period.to);
  toInclusive.setDate(toInclusive.getDate() - 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  return `${fmt(from)} — ${fmt(toInclusive)}`;
}

/** Build the list of dropdown choices: all time, ytd, current/last quarter, and every completed quarter in the last 2 years. */
export function standardPeriodChoices(now = new Date()): PeriodChoice[] {
  const { quarter, year } = currentQuarter(now);
  const choices: PeriodChoice[] = [
    { key: "all", label: "All time" },
    { key: "ytd", label: `Year to date (${year})` },
    { key: "this-quarter", label: `This quarter (Q${quarter} ${year})` },
    { key: "last-quarter", label: "Last quarter" },
  ];
  // Last 8 quarters explicitly
  for (let i = 1; i <= 8; i++) {
    const { quarter: q, year: y } = shiftQuarter(quarter, year, -i);
    choices.push({
      key: `q${q}-${y}`,
      label: `Q${q} ${y}`,
    });
  }
  return choices;
}

/** Whether a date is inside the resolved period. */
export function isInPeriod(d: Date | null, period: Period): boolean {
  if (period === null) return true;
  if (d === null) return false;
  return d >= period.from && d < period.to;
}

/** Build a Prisma date-range filter for the given period, or undefined for all-time. */
export function prismaPeriodFilter(period: Period):
  | { gte: Date; lt: Date }
  | undefined {
  if (period === null) return undefined;
  return { gte: period.from, lt: period.to };
}
