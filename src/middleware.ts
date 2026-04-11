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

// Routes that must never be indexed by search engines. Each one gets an
// X-Robots-Tag header on every response. These are private by purpose
// (dashboards, personal tickets/passes) or intentionally share-only
// (giveaways, events-links) — reachable by direct link but invisible to
// crawlers.
const noIndexPatterns = [
  /^\/dashboard(\/.*)?$/,
  /^\/pass\/.+/,
  /^\/ticket\/.+/,
  /^\/giveaway\/.+/,
  /^\/events-links(\/.*)?$/,
  /^\/checkout(\/.*)?$/,
  /^\/login\/?$/,
  /^\/register\/?$/,
];

const ROBOTS_HEADER = "noindex, nofollow, noarchive, nosnippet";

function isProtectedRoute(pathname: string): boolean {
  return protectedPatterns.some((p) => p.test(pathname));
}

function isProtectedApi(pathname: string, method: string): boolean {
  return protectedApiPatterns.some(
    (r) => r.pattern.test(pathname) && r.methods.includes(method)
  );
}

function isNoIndexRoute(pathname: string): boolean {
  return noIndexPatterns.some((p) => p.test(pathname));
}

function withRobotsHeader(res: NextResponse, pathname: string): NextResponse {
  if (isNoIndexRoute(pathname)) {
    res.headers.set("X-Robots-Tag", ROBOTS_HEADER);
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const method = req.method;

  const needsAuth = isProtectedRoute(pathname) || isProtectedApi(pathname, method);
  if (!needsAuth) {
    return withRobotsHeader(NextResponse.next(), pathname);
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
      return withRobotsHeader(NextResponse.redirect(url), pathname);
    }
    // Allow access to club/reseller dashboard with token (no JWT needed)
    return withRobotsHeader(NextResponse.next(), pathname);
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return withRobotsHeader(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        pathname
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return withRobotsHeader(NextResponse.redirect(loginUrl), pathname);
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());

    const headers = new Headers(req.headers);
    headers.set("x-user-id", payload.userId as string);
    headers.set("x-user-role", payload.role as string);

    return withRobotsHeader(
      NextResponse.next({ request: { headers } }),
      pathname
    );
  } catch {
    // Invalid token — clear cookie and redirect
    if (pathname.startsWith("/api/")) {
      return withRobotsHeader(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        pathname
      );
    }
    const loginUrl = new URL("/login", req.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return withRobotsHeader(response, pathname);
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/passes",
    "/api/tickets",
    // Noindex routes (no auth, just X-Robots-Tag header)
    "/pass/:path*",
    "/ticket/:path*",
    "/giveaway/:path*",
    "/events-links",
    "/events-links/:path*",
    "/checkout/:path*",
    "/login",
    "/register",
  ],
};
