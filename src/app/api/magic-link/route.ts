import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

// Admin-only: generate magic links for clubs and resellers
// POST /api/magic-link { type: "club"|"reseller", entityId: "..." }

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, entityId } = body as { type: string; entityId: string };

  const token = randomBytes(32).toString("hex");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (type === "club") {
    const account = await db.clubAccount.findFirst({ where: { clubId: entityId } });
    if (account) {
      await db.clubAccount.update({
        where: { id: account.id },
        data: { magicLinkToken: token },
      });
    } else {
      // Create a user + club account
      const club = await db.club.findUnique({ where: { id: entityId } });
      if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });
      
      const user = await db.user.create({
        data: {
          email: `club-${club.slug}@volumebrussels.com`,
          name: club.name,
          role: "club",
        },
      });
      await db.clubAccount.create({
        data: { clubId: entityId, userId: user.id, magicLinkToken: token },
      });
    }
    return NextResponse.json({ url: `${appUrl}/dashboard/club?token=${token}` });
  }

  if (type === "reseller") {
    const reseller = await db.reseller.findUnique({ where: { id: entityId } });
    if (!reseller) return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
    
    await db.reseller.update({
      where: { id: entityId },
      data: { magicLinkToken: token },
    });
    return NextResponse.json({ url: `${appUrl}/dashboard/reseller?token=${token}` });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
