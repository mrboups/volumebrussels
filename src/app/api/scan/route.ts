import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkSameOrigin, rateLimit } from "@/lib/scanGuard";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const BRUSSELS_TZ = "Europe/Brussels";

/**
 * Build a Brussels-zoned datetime by offsetting the current Brussels
 * calendar day by a number of days and setting the hour. Returns the
 * corresponding UTC Date for storage.
 *
 * We use date-fns-tz to avoid server-local timezone leakage and to
 * correctly handle DST boundaries in Brussels.
 */
function brusselsTarget(now: Date, addDays: number, targetHour: number): Date {
  // Today's Brussels calendar day as yyyy-MM-dd
  const todayStr = formatInTimeZone(now, BRUSSELS_TZ, "yyyy-MM-dd");
  // Compute the target day string. We use timestamp math on a UTC
  // representation of Brussels midnight and reformat — that way DST
  // transitions on the offset day are handled correctly.
  const brusselsMidnightUtc = fromZonedTime(`${todayStr}T00:00:00`, BRUSSELS_TZ);
  const offsetUtc = new Date(
    brusselsMidnightUtc.getTime() + addDays * 24 * 60 * 60 * 1000
  );
  const targetDayStr = formatInTimeZone(offsetUtc, BRUSSELS_TZ, "yyyy-MM-dd");
  const hh = String(targetHour).padStart(2, "0");
  return fromZonedTime(`${targetDayStr}T${hh}:00:00`, BRUSSELS_TZ);
}

/**
 * Pass expiry rules — Brussels time, not server local.
 *
 * Night pass
 *   - First scan during Friday night (Fri 12:00 → Sat 06:00 Brussels)
 *     → valid until Saturday 11:00 Brussels
 *   - First scan during Saturday night (Sat 12:00 → Sun 06:00 Brussels)
 *     → valid until Monday 02:00 Brussels (allows the Sunday night /
 *       Monday-early-morning after-party)
 *   - Any other time → 24h from scan (fallback; shouldn't happen in
 *     practice because clubs are only open Fri / Sat / Sun night).
 *
 * Weekend pass
 *   - Always expires next Monday 02:00 Brussels, regardless of the
 *     first-scan day. Gives the customer Fri night + Sat night + Sun
 *     night + Monday early-morning after-parties.
 */
function computeExpiresAt(passType: string, now: Date): Date {
  // ISO weekday: Mon=1 .. Sun=7. getDay() is 0..6 in server local.
  const day = parseInt(formatInTimeZone(now, BRUSSELS_TZ, "i"), 10);
  const hour = parseInt(formatInTimeZone(now, BRUSSELS_TZ, "H"), 10);

  if (passType === "night") {
    // Saturday night: Sat 12:00 or Sun 00:00-06:00
    if ((day === 6 && hour >= 12) || (day === 7 && hour < 6)) {
      const daysUntilMonday = day === 6 ? 2 : 1;
      return brusselsTarget(now, daysUntilMonday, 2);
    }
    // Friday night: Fri 12:00 or Sat 00:00-06:00
    if ((day === 5 && hour >= 12) || (day === 6 && hour < 6)) {
      const daysUntilSaturday = day === 5 ? 1 : 0;
      return brusselsTarget(now, daysUntilSaturday, 11);
    }
    // Off-hours fallback: give them 24h from now
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  if (passType === "weekend") {
    // Days until the next Monday (Mon=1..Sun=7)
    let daysUntilMonday = (8 - day) % 7; // 0 when today is Monday
    if (daysUntilMonday === 0) {
      // It's Monday. Before 02:00 → use today's 02:00, otherwise push
      // to next Monday (user bought a weekend pass on Monday, which is
      // weird but we don't want to return a past date).
      daysUntilMonday = hour < 2 ? 0 : 7;
    }
    return brusselsTarget(now, daysUntilMonday, 2);
  }

  // Unknown pass type fallback
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  try {
    const originError = checkSameOrigin(req);
    if (originError) return originError;

    const body = await req.json();
    const { passId, clubId, museumId } = body as {
      passId?: string;
      clubId?: string;
      museumId?: string;
    };

    // Validate input
    if (!passId) {
      return NextResponse.json(
        { error: "passId is required" },
        { status: 400 }
      );
    }

    const rlError = rateLimit(req, passId);
    if (rlError) return rlError;

    if (!clubId && !museumId) {
      return NextResponse.json(
        { error: "Either clubId or museumId is required" },
        { status: 400 }
      );
    }

    // Find pass with existing scans
    const pass = await db.pass.findUnique({
      where: { id: passId },
      include: { scans: true },
    });

    if (!pass) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    // Reject refunded passes
    if (pass.status === "refunded") {
      return NextResponse.json(
        { error: "Pass has been refunded" },
        { status: 400 }
      );
    }

    // Reject expired passes
    if (pass.status === "expired") {
      return NextResponse.json(
        { error: "Pass has expired" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Check runtime expiry for active passes
    if (pass.status === "active" && pass.expiresAt && now > pass.expiresAt) {
      await db.pass.update({
        where: { id: passId },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "Pass has expired" },
        { status: 400 }
      );
    }

    // Check not already scanned at this venue
    const alreadyScanned = pass.scans.some(
      (s) =>
        (clubId && s.clubId === clubId) ||
        (museumId && s.museumId === museumId)
    );
    if (alreadyScanned) {
      return NextResponse.json(
        { error: "Already checked in at this venue" },
        { status: 400 }
      );
    }

    // Night pass: max 2 club scans
    if (pass.type === "night" && clubId) {
      const clubScanCount = pass.scans.filter((s) => s.clubId !== null).length;
      if (clubScanCount >= 2) {
        return NextResponse.json(
          { error: "Night pass limited to 2 clubs" },
          { status: 400 }
        );
      }
    }

    // Determine activation: only first CLUB scan activates the pass
    let activatedAt = pass.activatedAt;
    let expiresAt = pass.expiresAt;
    let newStatus = pass.status;

    if (clubId && pass.status === "purchased") {
      activatedAt = now;
      expiresAt = computeExpiresAt(pass.type, now);
      newStatus = "active";
    }

    // Museum scans do NOT activate the pass
    // Museums require the pass to be active
    if (museumId && pass.status === "purchased") {
      return NextResponse.json(
        { error: "Pass must be activated at a club first before visiting museums" },
        { status: 400 }
      );
    }

    // Check museum access window (1 week from activation)
    if (museumId && activatedAt) {
      const museumDeadline = new Date(activatedAt);
      museumDeadline.setDate(museumDeadline.getDate() + 7);
      if (now > museumDeadline) {
        return NextResponse.json(
          { error: "Museum access window has expired (1 week from activation)" },
          { status: 400 }
        );
      }
    }

    // Create scan + update pass in a transaction
    const [scan] = await db.$transaction([
      db.passScan.create({
        data: {
          passId,
          clubId: clubId || null,
          museumId: museumId || null,
          scannedAt: now,
        },
        include: { club: true, museum: true },
      }),
      db.pass.update({
        where: { id: passId },
        data: {
          status: newStatus,
          activatedAt,
          expiresAt,
        },
      }),
    ]);

    return NextResponse.json({
      scan: {
        id: scan.id,
        passId: scan.passId,
        clubId: scan.clubId,
        museumId: scan.museumId,
        scannedAt: scan.scannedAt.toISOString(),
        scannedBy: scan.scannedBy,
        club: scan.club,
        museum: scan.museum,
      },
      pass: {
        status: newStatus,
        activatedAt: activatedAt?.toISOString() ?? null,
        expiresAt: expiresAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
