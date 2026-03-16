import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { checkRateLimit } from "./rate-limit";
import { logAuditEvent } from "./audit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          logAuditEvent({
            action: "AUTH_LOGIN",
            outcome: "FAILURE",
            details: { reason: "missing_credentials" },
          });
          throw new Error("Invalid credentials");
        }

        const email = credentials.email.trim().toLowerCase();
        const forwardedFor = (req as any)?.headers?.["x-forwarded-for"];
        const ip = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : "unknown";
        const limiter = checkRateLimit(`${ip}:${email}`, "auth");
        if (!limiter.allowed) {
          logAuditEvent({
            action: "AUTH_LOGIN",
            outcome: "FAILURE",
            details: { reason: "rate_limited", email, ip },
          });
          throw new Error("Too many login attempts. Please wait and try again.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            student: { include: { department: true } },
            faculty: { include: { department: true } },
          },
        });

        if (!user || user.status !== "active") {
          logAuditEvent({
            action: "AUTH_LOGIN",
            outcome: "FAILURE",
            details: { reason: "invalid_user_or_inactive", email, ip },
          });
          throw new Error("Invalid credentials");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          logAuditEvent({
            action: "AUTH_LOGIN",
            outcome: "FAILURE",
            actorId: user.id,
            actorRole: user.role,
            details: { reason: "password_mismatch", email, ip },
          });
          throw new Error("Invalid credentials");
        }

        logAuditEvent({
          action: "AUTH_LOGIN",
          outcome: "SUCCESS",
          actorId: user.id,
          actorRole: user.role,
          details: { email, ip },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.student?.id || null,
          facultyId: user.faculty?.id || null,
          department: user.student?.department?.name || user.faculty?.department?.name || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.userId = user.id;
        token.studentId = (user as any).studentId;
        token.facultyId = (user as any).facultyId;
        token.department = (user as any).department;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).userId = token.userId;
        (session.user as any).studentId = token.studentId;
        (session.user as any).facultyId = token.facultyId;
        (session.user as any).department = token.department;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
