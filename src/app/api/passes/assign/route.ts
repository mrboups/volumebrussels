import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPassEmail } from "@/lib/email";
import type { PassType } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passId, email, name } = body as {
      passId: string;
      email: string;
      name?: string;
    };

    if (!passId || !email) {
      return NextResponse.json(
        { error: "passId and email are required" },
        { status: 400 }
      );
    }

    // Find the pass
    const pass = await db.pass.findUnique({ where: { id: passId } });
    if (!pass) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    if (pass.status === "refunded") {
      return NextResponse.json(
        { error: "This pass has been refunded" },
        { status: 400 }
      );
    }

    // Find or create user by email
    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: name || null,
          role: "customer",
        },
      });
    }

    // Update the pass to the new user
    await db.pass.update({
      where: { id: passId },
      data: { userId: user.id },
    });

    // Send pass email to the assigned user
    try {
      await sendPassEmail({
        to: email,
        passId: pass.id,
        passType: pass.type as PassType,
        customerName: user.name || name || undefined,
      });
    } catch (emailErr) {
      console.error("Failed to send assigned pass email:", emailErr);
      // Don't fail the assignment if email fails
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Pass assign error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Assignment failed" },
      { status: 500 }
    );
  }
}
