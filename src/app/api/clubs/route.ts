import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const clubs = await db.club.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(clubs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const club = await db.club.create({
    data: {
      name: body.name,
      slug: body.slug,
      address: body.address,
      description: body.description,
      pictures: body.pictures || [],
      instagramUrl: body.instagramUrl,
      facebookUrl: body.facebookUrl,
      payPerVisit: body.payPerVisit ?? 10,
      openDays: body.openDays || [],
      passInclusion: body.passInclusion ?? "both",
    },
  });

  return NextResponse.json(club, { status: 201 });
}
