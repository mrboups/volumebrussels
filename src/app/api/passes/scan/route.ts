import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function computeExpiresAt(passType: string, now: Date): Date {
  const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat

  if (passType === "night") {
    if (day === 5) {
      // Friday -> expires Saturday 11:00 AM
      const expires = new Date(now);
      expires.setDate(expires.getDate() + 1);
      expires.setHours(11, 0, 0, 0);
      return expires;
    }
    if (day === 6) {
      // Saturday -> expires Sunday 11:00 AM
      const expires = new Date(now);
      expires.setDate(expires.getDate() + 1);
      expires.setHours(11, 0, 0, 0);
      return expires;
    }
    // Any other day (e.g. early Sunday morning after midnight treated as Saturday night)
    if (day === 0 && now.getHours() < 11) {
      // Sunday before 11AM -> treat as Saturday night activation, expires Sunday 11:00 AM
      const expires = new Date(now);
      expires.setHours(11, 0, 0, 0);
      return expires;
    }
    // Fallback: 24h from now
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  if (passType === "weekend") {
    if (day === 5) {
      // Friday -> expires Sunday 11:00 PM
      const expires = new Date(now);
      expires.setDate(expires.getDate() + 2);
      expires.setHours(23, 0, 0, 0);
      return expires;
    }
    if (day === 6) {
      // Saturday -> expires Sunday 11:00 PM
      const expires = new Date(now);
      expires.setDate(expires.getDate() + 1);
      expires.setHours(23, 0, 0, 0);
      return expires;
    }
    if (day === 0 && now.getHours() < 23) {
      // Sunday -> expires Sunday 11:00 PM
      const expires = new Date(now);
      expires.setHours(23, 0, 0, 0);
      return expires;
    }
    // Fallback: 48h from now
    return new Date(now.getTime() + 48 * 60 * 60 * 1000);
  }

  // Fallback
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passId, clubId, museumId } = body;

    if (!passId) {
      return NextResponse.json({ error: "passId is required" }, { status: 400 });
    }

    if (!clubId && !museumId) {
      return NextResponse.json(
        { error: "Either clubId or museumId is required" },
        { status: 400 }
      );
    }

    const pass = await db.pass.findUnique({
      where: { id: passId },
      include: {
        scans: { include: { club: true, museum: true } },
      },
    });

    if (!pass) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    if (pass.status === "expired") {
      return NextResponse.json({ error: "Pass has expired" }, { status: 400 });
    }

    if (pass.status === "refunded") {
      return NextResponse.json({ error: "Pass has been refunded" }, { status: 400 });
    }

    const now = new Date();

    // If pass is active, check expiry
    if (pass.status === "active" && pass.expiresAt && now > pass.expiresAt) {
      await db.pass.update({
        where: { id: passId },
        data: { status: "expired" },
      });
      return NextResponse.json({ error: "Pass has expired" }, { status: 400 });
    }

    // For club scans
    if (clubId) {
      // Check if already scanned at this club
      const existingScan = pass.scans.find((s) => s.clubId === clubId);
      if (existingScan) {
        return NextResponse.json(
          { error: "Already checked in at this club" },
          { status: 400 }
        );
      }

      // For night pass, max 2 club scans
      if (pass.type === "night") {
        const clubScanCount = pass.scans.filter((s) => s.clubId !== null).length;
        if (clubScanCount >= 2) {
          return NextResponse.json(
            { error: "Night pass limited to 2 clubs" },
            { status: 400 }
          );
        }
      }

      // If pass is purchased (not yet activated), activate it
      if (pass.status === "purchased") {
        const expiresAt = computeExpiresAt(pass.type, now);
        await db.pass.update({
          where: { id: passId },
          data: {
            status: "active",
            activatedAt: now,
            expiresAt,
          },
        });
      }

      // Create scan
      const scan = await db.passScan.create({
        data: {
          passId,
          clubId,
          scannedAt: now,
        },
        include: { club: true, museum: true },
      });

      // Return updated pass
      const updatedPass = await db.pass.findUnique({
        where: { id: passId },
        include: {
          scans: { include: { club: true, museum: true } },
        },
      });

      return NextResponse.json({ pass: updatedPass, scan });
    }

    // For museum scans
    if (museumId) {
      // Check if already scanned at this museum
      const existingMuseumScan = pass.scans.find((s) => s.museumId === museumId);
      if (existingMuseumScan) {
        return NextResponse.json(
          { error: "Already checked in at this museum" },
          { status: 400 }
        );
      }

      // Museums don't activate the pass but require it to be active
      if (pass.status === "purchased") {
        return NextResponse.json(
          { error: "Pass must be activated at a club first before visiting museums" },
          { status: 400 }
        );
      }

      // Check museum access window (1 week from activation)
      if (pass.activatedAt) {
        const museumDeadline = new Date(pass.activatedAt);
        museumDeadline.setDate(museumDeadline.getDate() + 7);
        if (now > museumDeadline) {
          return NextResponse.json(
            { error: "Museum access window has expired (1 week from activation)" },
            { status: 400 }
          );
        }
      }

      const scan = await db.passScan.create({
        data: {
          passId,
          museumId,
          scannedAt: now,
        },
        include: { club: true, museum: true },
      });

      const updatedPass = await db.pass.findUnique({
        where: { id: passId },
        include: {
          scans: { include: { club: true, museum: true } },
        },
      });

      return NextResponse.json({ pass: updatedPass, scan });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Pass scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
