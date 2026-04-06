import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const museums = await db.museum.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(museums);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const museum = await db.museum.create({
    data: {
      name: body.name,
      slug: body.slug,
      address: body.address,
      description: body.description,
      pictures: body.pictures || [],
      websiteUrl: body.websiteUrl,
      payPerVisit: body.payPerVisit ?? 8,
    },
  });

  return NextResponse.json(museum, { status: 201 });
}
