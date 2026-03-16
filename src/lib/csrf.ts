/**
 * ERP-009: CSRF protection for Route Handler POST/PUT/DELETE endpoints.
 * Validates Origin header matches the application URL.
 */

import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.NEXTAUTH_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => {
    try {
      return new URL(origin).origin;
    } catch {
      return origin;
    }
  });

export function checkCsrf(request: Request): NextResponse | null {
  const method = request.method;

  // Only check state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const isAllowedOrigin = (value: string) => {
    try {
      return ALLOWED_ORIGINS.includes(new URL(value).origin);
    } catch {
      return false;
    }
  };

  // Accept if origin matches exactly
  if (origin && isAllowedOrigin(origin)) {
    return null;
  }

  // Accept if referer matches when origin is absent
  if (!origin && referer && isAllowedOrigin(referer)) {
    return null;
  }

  // Reject state-changing requests that do not provide a trusted origin signal.
  if (!origin && !referer) {
    return NextResponse.json(
      { error: "CSRF validation failed - missing origin/referrer" },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { error: "CSRF validation failed - request origin not allowed" },
    { status: 403 }
  );
}
