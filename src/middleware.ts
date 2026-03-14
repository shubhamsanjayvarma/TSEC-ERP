import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't need auth
  const publicPaths = ["/login", "/api/auth"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // No token → redirect to login
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based API protection
  const role = token.role as string;

  // Admin-only routes
  const adminOnlyPaths = ["/api/faculty", "/api/departments"];
  if (
    adminOnlyPaths.some((p) => pathname.startsWith(p)) &&
    request.method === "POST" &&
    role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Student-only can't mark attendance
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
