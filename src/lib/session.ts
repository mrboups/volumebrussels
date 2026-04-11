import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

const COOKIE_NAME = "volume_token";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

/**
 * Require an authenticated admin. Throws if the caller is not an admin.
 * Use at the top of every server action that mutates admin-only data.
 * Thrown errors surface as generic errors in the UI rather than leaking
 * "you are not admin" details.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

/**
 * Same as requireAdmin() but returns the result rather than throwing,
 * so API routes can return a proper 401/403 JSON response.
 */
export async function isAdminRequest(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && user.role === "admin";
}
