import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * ERP-003: Authentication middleware protecting all routes by default.
 * Only explicitly listed public paths are accessible without auth.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't need auth
  const publicPaths = ["/login", "/api/auth"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    // Add security headers to responses even for public paths
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // Also allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/img") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg")
  ) {
    return NextResponse.next();
  }

  // Check JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // No token → redirect to login or return 401
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = token.role as string;
  const response = NextResponse.next();

  // Role-based API protection
  // Admin-only mutation routes
  const adminOnlyPaths = ["/api/faculty", "/api/departments"];
  if (
    adminOnlyPaths.some((p) => pathname.startsWith(p)) &&
    request.method === "POST" &&
    role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Student can't mark attendance
  if (
    pathname.startsWith("/api/attendance") &&
    request.method === "POST" &&
    role === "STUDENT"
  ) {
    return NextResponse.json(
      { error: "Students cannot mark attendance" },
      { status: 403 }
    );
  }

  // Students can't upload marks
  if (
    pathname.startsWith("/api/marks") &&
    request.method === "POST" &&
    role === "STUDENT"
  ) {
    return NextResponse.json(
      { error: "Students cannot upload marks" },
      { status: 403 }
    );
  }

  // Students can't manage exams
  if (
    pathname.startsWith("/api/exams") &&
    request.method === "POST" &&
    role === "STUDENT"
  ) {
    return NextResponse.json(
      { error: "Students cannot manage exams" },
      { status: 403 }
    );
  }

  // Only admin can delete
  if (
    pathname.startsWith("/api/") &&
    request.method === "DELETE" &&
    role !== "ADMIN"
  ) {
    return NextResponse.json(
      { error: "Only administrators can perform delete operations" },
      { status: 403 }
    );
  }

  addSecurityHeaders(response);
  return response;
}

function addSecurityHeaders(response: NextResponse) {
  // ERP-011: Baseline browser hardening headers.
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
