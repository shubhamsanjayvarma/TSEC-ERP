import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { validateRequest, changePasswordSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";

export async function PUT(request: NextRequest) {
  try {
    const csrfError = checkCsrf(request);
    if (csrfError) return csrfError;

    // Rate limit password changes strictly (auth type)
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "auth");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.userId) {
      logAuditEvent({
        action: "PASSWORD_CHANGE",
        outcome: "FAILURE",
        details: { reason: "unauthorized" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateRequest(request, changePasswordSchema);
    if (!validation.success) return validation.response;
    const { currentPassword, newPassword } = validation.data;
    if (currentPassword === newPassword) {
      logAuditEvent({
        action: "PASSWORD_CHANGE",
        outcome: "FAILURE",
        actorId: token.userId as string,
        details: { reason: "same_as_current" },
      });
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: token.userId as string },
    });

    if (!user) {
      logAuditEvent({
        action: "PASSWORD_CHANGE",
        outcome: "FAILURE",
        actorId: token.userId as string,
        details: { reason: "user_not_found" },
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      logAuditEvent({
        action: "PASSWORD_CHANGE",
        outcome: "FAILURE",
        actorId: token.userId as string,
        actorRole: user.role,
        details: { reason: "invalid_current_password" },
      });
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    logAuditEvent({
      action: "PASSWORD_CHANGE",
      outcome: "SUCCESS",
      actorId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    logAuditEvent({
      action: "PASSWORD_CHANGE",
      outcome: "FAILURE",
      details: { reason: "server_error" },
    });
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
