import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, createNoticeSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "query");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();

    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrfError = checkCsrf(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "mutation");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();
    const roleError = requireRole(session, "ADMIN", "FACULTY");
    if (roleError) return roleError;

    const validation = await validateRequest(request, createNoticeSchema);
    if (!validation.success) return validation.response;
    const { title, content, priority, targetRole } = validation.data;

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        priority: priority || "normal",
        targetRole: targetRole || null,
        createdBy: session.userId,
      },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
