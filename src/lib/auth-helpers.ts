/**
 * ERP-007: Authorization helper for IDOR prevention.
 * Centralises role/ownership checks for data access.
 */

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export interface SessionUser {
  userId: string;
  role: string;
  studentId: string | null;
  facultyId: string | null;
  department: string | null;
  email: string;
  name: string;
}

/**
 * Extract the authenticated user's session from a request.
 * Returns null if not authenticated.
 */
export async function getSessionUser(request: NextRequest | Request): Promise<SessionUser | null> {
  try {
    const token = await getToken({
      req: request as NextRequest,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) return null;

    return {
      userId: token.userId as string,
      role: token.role as string,
      studentId: (token.studentId as string) || null,
      facultyId: (token.facultyId as string) || null,
      department: (token.department as string) || null,
      email: token.email || "",
      name: token.name || "",
    };
  } catch {
    return null;
  }
}

/**
 * Check if the user has the required role(s).
 */
export function hasRole(session: SessionUser, ...roles: string[]): boolean {
  return roles.includes(session.role);
}

/**
 * Require specific role(s). Returns 403 response if role doesn't match.
 */
export function requireRole(session: SessionUser, ...roles: string[]): NextResponse | null {
  if (hasRole(session, ...roles)) return null;
  return NextResponse.json({ error: "Forbidden — insufficient permissions" }, { status: 403 });
}

/**
 * Check if a user can access a specific student record.
 * Admins and Faculty can access all; Students can only access their own.
 */
export function canAccessStudent(session: SessionUser, studentId: string): boolean {
  if (session.role === "ADMIN" || session.role === "FACULTY") return true;
  return session.studentId === studentId;
}

/**
 * Check if a user can access a specific faculty record.
 * Admins can access all; Faculty can only access their own.
 */
export function canAccessFaculty(session: SessionUser, facultyId: string): boolean {
  if (session.role === "ADMIN") return true;
  return session.facultyId === facultyId;
}

/**
 * Return an unauthorized response.
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Return a forbidden response.
 */
export function forbiddenResponse(message = "Forbidden — you do not have access to this resource") {
  return NextResponse.json({ error: message }, { status: 403 });
}
