import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { action, email, password, name } = await req.json();

  if (action === "register") {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const user = await db.user.create({
      data: { email, name, password: hashed, role: "customer" },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  }

  if (action === "login") {
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({ id: user.id, email: user.email, role: user.role });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
