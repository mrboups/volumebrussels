/**
 * Generic in-memory sliding-window rate limiter.
 *
 * Process-local only — on a single Railway worker this is effective, on
 * a multi-worker setup it acts per-worker, which is still a meaningful
 * bar. Good enough for brute-force protection on auth and swipe
 * endpoints without reaching for an external store.
 */

import { NextRequest, NextResponse } from "next/server";

interface Bucket {
  windowStart: number;
  count: number;
}

// Single shared Map across all limiters. Key is composed of namespace +
// identifier so different endpoints do not share buckets.
const buckets = new Map<string, Bucket>();

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

interface RateLimitOptions {
  /** Short namespace to partition keys, e.g. "auth", "scan". */
  namespace: string;
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Max requests allowed per identifier within the window. */
  max: number;
}

/**
 * Returns null if the caller is under the limit (and increments the
 * counter). Returns a NextResponse 429 if the limit has been exceeded.
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): NextResponse | null {
  const key = `${options.namespace}|${identifier}`;
  const now = Date.now();

  // Opportunistic sweep to stop the Map from growing without bound.
  if (buckets.size > 1024) {
    for (const [k, b] of buckets) {
      if (now - b.windowStart > options.windowMs * 4) {
        buckets.delete(k);
      }
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > options.windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > options.max) {
    const retryAfter = Math.ceil(
      (options.windowMs - (now - bucket.windowStart)) / 1000
    );
    return NextResponse.json(
      { error: "Too many attempts, please try again in a minute" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(retryAfter, 1)) },
      }
    );
  }

  return null;
}
