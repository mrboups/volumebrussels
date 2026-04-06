import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const passes = await db.pass.findMany({
    where: { userId },
    include: { scans: { include: { club: true, museum: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(passes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const pass = await db.pass.create({
    data: {
      type: body.type,
      price: body.price,
      userId: body.userId,
      stripePaymentId: body.stripePaymentId,
      resellerId: body.resellerId,
    },
  });

  return NextResponse.json(pass, { status: 201 });
}
