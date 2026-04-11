import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, generateToken } from "@/lib/auth";

const COOKIE_NAME = "volume_token";
const MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

function authCookieOptions(clear = false) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: clear ? 0 : MAX_AGE,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { action, email: rawEmail, password, name } = await req.json();
    const email =
      typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : rawEmail;

    if (action === "register") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        );
      }

      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }

      const hashed = await hashPassword(password);
      const user = await db.user.create({
        data: { email, name, password: hashed, role: "customer" },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response = NextResponse.json({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      response.cookies.set(COOKIE_NAME, token, authCookieOptions());
      return response;
    }

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        );
      }

      const user = await db.user.findUnique({ where: { email } });
      if (!user || !user.password) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response = NextResponse.json({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      response.cookies.set(COOKIE_NAME, token, authCookieOptions());
      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      response.cookies.set(COOKIE_NAME, "", authCookieOptions(true));
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
