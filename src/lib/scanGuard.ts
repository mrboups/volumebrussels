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
import { rateLimit as sharedRateLimit, getClientIp } from "./rateLimiter";

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

/**
 * Reject if the same (IP, resourceId) combination has hit the endpoint
 * more than 10 times in the last minute.
 */
export function rateLimit(
  req: NextRequest,
  resourceId: string
): NextResponse | null {
  const ip = getClientIp(req);
  return sharedRateLimit(`${ip}|${resourceId}`, {
    namespace: "scan",
    windowMs: 60_000,
    max: 10,
  });
}
