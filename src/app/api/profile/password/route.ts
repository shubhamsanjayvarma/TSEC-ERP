import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { validateRequest, changePasswordSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateRequest(request, changePasswordSchema);
    if (!validation.success) return validation.response;
    const { currentPassword, newPassword } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: token.userId as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
