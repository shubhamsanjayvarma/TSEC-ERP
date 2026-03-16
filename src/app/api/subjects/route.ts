import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "query");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();

    const where: any = {};
    if (session.role === "FACULTY" && session.facultyId) {
      where.assignments = { some: { facultyId: session.facultyId } };
    } else if (session.role === "STUDENT" && session.department) {
      where.department = { name: session.department };
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: { department: { select: { name: true } } },
      orderBy: { code: "asc" },
    });
    return NextResponse.json(subjects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}
