/**
 * Pricing helpers for reseller commission and club ticket retribution.
 *
 * All calculations here are the single source of truth. Every dashboard
 * that totals reseller fees or computes per-ticket club payouts should
 * route through these functions rather than doing arithmetic inline.
 */

// ---------- Reseller commission ----------

export interface CommissionTier {
  /** Price threshold inclusive — the tier applies when price <= upTo.
   *  null means "and above" (open-ended last tier). */
  upTo: number | null;
  /** Rate between 0 and 1. 0.08 = 8%. */
  rate: number;
}

/**
 * Parse a CommissionTier[] out of whatever Prisma gave us for a JSON
 * column. Falls back to a single flat 8% tier if the data is missing,
 * malformed, or empty.
 */
export function parseTiers(value: unknown): CommissionTier[] {
  if (!Array.isArray(value)) return [{ upTo: null, rate: 0.08 }];
  const valid: CommissionTier[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    const upTo =
      obj.upTo === null || obj.upTo === undefined
        ? null
        : typeof obj.upTo === "number"
          ? obj.upTo
          : typeof obj.upTo === "string" && !Number.isNaN(parseFloat(obj.upTo))
            ? parseFloat(obj.upTo)
            : undefined;
    const rate =
      typeof obj.rate === "number"
        ? obj.rate
        : typeof obj.rate === "string"
          ? parseFloat(obj.rate)
          : undefined;
    if (upTo === undefined) continue;
    if (rate === undefined || Number.isNaN(rate)) continue;
    valid.push({ upTo, rate });
  }
  if (valid.length === 0) return [{ upTo: null, rate: 0.08 }];
  return sortTiers(valid);
}

/** Sort tiers ascending by upTo. Null (open-ended) goes last. */
function sortTiers(tiers: CommissionTier[]): CommissionTier[] {
  return [...tiers].sort((a, b) => {
    if (a.upTo === null) return 1;
    if (b.upTo === null) return -1;
    return a.upTo - b.upTo;
  });
}

/**
 * Resolve which tier applies to a given price.
 * First tier where price <= upTo (non-marginal) wins. If price exceeds
 * every bounded tier, the open-ended tier (upTo: null) applies.
 */
export function resolveTier(
  price: number,
  tiers: CommissionTier[]
): CommissionTier {
  const sorted = sortTiers(tiers);
  for (const t of sorted) {
    if (t.upTo === null) return t;
    if (price <= t.upTo) return t;
  }
  // Shouldn't happen because a valid tier list always ends with upTo=null,
  // but fall back to the last tier just in case.
  return sorted[sorted.length - 1] ?? { upTo: null, rate: 0 };
}

/**
 * Commission amount in the same currency as `price`. Non-marginal: the
 * whole price is multiplied by the resolved tier's rate.
 */
export function resellerCommission(
  price: number,
  tiers: CommissionTier[]
): number {
  if (price <= 0) return 0;
  const tier = resolveTier(price, tiers);
  return price * tier.rate;
}

// ---------- Club ticket retribution ----------

/** Default formula constants — exposed so the UI can reference them. */
export const CLUB_TICKET_FEE_HIGH = 10; // €10 flat at this price or above
export const CLUB_TICKET_FEE_THRESHOLD = 14; // €14
export const CLUB_TICKET_FEE_LOW_DEDUCTION = 4; // pricePaid − 4 below threshold

/**
 * How much the club earns per validated ticket.
 *
 * - If the event has an explicit `clubTicketFee` override, that value is used.
 * - Otherwise: €10 for tickets at or above €14, or `max(0, price − 4)` below.
 */
export function computeClubTicketFee(
  pricePaid: number,
  event: { clubTicketFee?: number | null } | null | undefined
): number {
  const override = event?.clubTicketFee;
  if (override !== null && override !== undefined) {
    return Math.max(0, override);
  }
  if (pricePaid >= CLUB_TICKET_FEE_THRESHOLD) return CLUB_TICKET_FEE_HIGH;
  return Math.max(0, pricePaid - CLUB_TICKET_FEE_LOW_DEDUCTION);
}
