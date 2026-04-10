import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "volume_token";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET || "";
  return new TextEncoder().encode(secret);
}

// Routes that require authentication
const protectedPatterns = [
  /^\/dashboard(\/.*)?$/,
];

// API routes that require authentication (POST only checked separately)
const protectedApiPatterns = [
  { pattern: /^\/api\/passes$/, methods: ["POST"] },
  { pattern: /^\/api\/tickets$/, methods: ["POST"] },
];

function isProtectedRoute(pathname: string): boolean {
  return protectedPatterns.some((p) => p.test(pathname));
}

function isProtectedApi(pathname: string, method: string): boolean {
  return protectedApiPatterns.some(
    (r) => r.pattern.test(pathname) && r.methods.includes(method)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const method = req.method;

  const needsAuth = isProtectedRoute(pathname) || isProtectedApi(pathname, method);
  if (!needsAuth) {
    return NextResponse.next();
  }

  // Magic link tokens — restrict access to only their specific dashboard
  const urlToken = searchParams.get("token");

  // If there's a magic link token in the URL, only allow on /dashboard/club or /dashboard/reseller
  if (urlToken) {
    const allowedPaths = ["/dashboard/club", "/dashboard/reseller"];
    if (!allowedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      // Redirect to /dashboard/club with the token
      const url = new URL("/dashboard/club", req.url);
      url.searchParams.set("token", urlToken);
      return NextResponse.redirect(url);
    }
    // Allow access to club/reseller dashboard with token (no JWT needed)
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());

    const headers = new Headers(req.headers);
    headers.set("x-user-id", payload.userId as string);
    headers.set("x-user-role", payload.role as string);

    return NextResponse.next({ request: { headers } });
  } catch {
    // Invalid token — clear cookie and redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/passes",
    "/api/tickets",
  ],
};
