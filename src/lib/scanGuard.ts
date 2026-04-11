/**
 * Lightweight defenses for the pass / ticket scan endpoints.
 *
 * Staff swipe on the customer's own phone, so there is no separate staff
 * credential to inject. The pass URL itself is the primary credential,
 * same security model as any e-ticket QR code. These helpers add two
 * cheap defense-in-depth layers:
 *
 *   1. Same-origin check — block cross-site fetches that bypass the
 *      browser's CORS default (i.e. non-browser clients). A missing or
 *      mismatched Origin / Referer header is rejected.
 *
 *   2. Per-IP + per-pass rate limit — an in-memory sliding window that
 *      stops rapid-fire burn attempts. Process-local only, so on Railway
 *      with a single worker this is effective; in a multi-worker setup it
 *      acts per-worker which is still a meaningful bar.
 */

import { NextRequest, NextResponse } from "next/server";

export function checkSameOrigin(req: NextRequest): NextResponse | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // If the env var is missing, skip the check so local dev still works.
  if (!appUrl) return null;

  let appHost: string;
  try {
    appHost = new URL(appUrl).host;
  } catch {
    return null;
  }

  // Accept same-origin Origin header first (the normal browser case).
  if (origin) {
    try {
      if (new URL(origin).host === appHost) return null;
    } catch {
      // fall through
    }
    // Origin present but wrong → reject immediately.
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // No Origin header (some browser edge cases, curl, etc). Accept a
  // matching Referer as a fallback signal.
  if (referer) {
    try {
      if (new URL(referer).host === appHost) return null;
    } catch {
      // fall through
    }
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ---------- Rate limit ----------

interface Bucket {
  windowStart: number;
  count: number;
}

const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 10;
const buckets = new Map<string, Bucket>();

// Drop old buckets periodically so the map does not grow unbounded.
function sweepBuckets(now: number) {
  if (buckets.size < 512) return;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS * 4) {
      buckets.delete(key);
    }
  }
}

/**
 * Reject if the same (IP, resourceId) combination has hit the endpoint
 * more than MAX_PER_WINDOW times in the current minute.
 */
export function rateLimit(
  req: NextRequest,
  resourceId: string
): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const key = `${ip}|${resourceId}`;
  const now = Date.now();
  sweepBuckets(now);

  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { windowStart: now, count: 1 });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > MAX_PER_WINDOW) {
    return NextResponse.json(
      { error: "Too many attempts, please try again in a minute" },
      { status: 429 }
    );
  }

  return null;
}
