import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkSameOrigin, rateLimit } from "@/lib/scanGuard";

function computeExpiresAt(passType: string, now: Date): Date {
  const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat

  if (passType === "night") {
    if (day === 5) {
      // Friday night → Saturday 18:00
      const expires = new Date(now);
      expires.setDate(expires.getDate() + 1);
      expires.setHours(18, 0, 0, 0);
      return expires;
    }
    if (day === 6 || (day === 0 && now.getHours() < 6)) {
      // Saturday night → Sunday 00:00 (midnight)
      const expires = new Date(now);
      if (day === 6) expires.setDate(expires.getDate() + 1);
      expires.setHours(0, 0, 0, 0);
      if (day === 6) return expires;
      // Sunday early morning (after midnight Saturday) → already Sunday
      expires.setHours(0, 0, 0, 0);
      return expires;
    }
    // Fallback: next day 18:00
    const expires = new Date(now);
    expires.setDate(expires.getDate() + 1);
    expires.setHours(18, 0, 0, 0);
    return expires;
  }

  if (passType === "weekend") {
    // Weekend pass always expires Sunday 00:00 (midnight end of Sunday)
    const daysUntilSunday = (7 - day) % 7;
    const expires = new Date(now);
    if (daysUntilSunday === 0 && now.getHours() >= 0) {
      // Already Sunday → end of today
      expires.setHours(23, 59, 59, 999);
      return expires;
    }
    expires.setDate(expires.getDate() + daysUntilSunday);
    expires.setHours(23, 59, 59, 999);
    return expires;
  }

  // Fallback: +24h
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
