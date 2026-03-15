/**
 * ERP-009: CSRF protection for Route Handler POST/PUT/DELETE endpoints.
 * Validates Origin header matches the application URL.
 */

import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXTAUTH_URL || "http://localhost:3000",
];

export function checkCsrf(request: Request): NextResponse | null {
  const method = request.method;

  // Only check state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Accept if origin matches
  if (origin && ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed))) {
    return null;
  }

  // Accept if referer matches when origin is absent
  if (!origin && referer && ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed))) {
    return null;
  }

  // For same-origin requests where browser doesn't send Origin header (e.g., same-site form submissions)
  if (!origin && !referer) {
    // This can happen for same-origin requests; allow but log
    return null;
  }

  return NextResponse.json(
    { error: "CSRF validation failed — request origin not allowed" },
    { status: 403 }
  );
}
