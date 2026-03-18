/**
 * ERP-008: Zod schema validation for all API inputs.
 * TypeScript types are compile-time only — Zod enforces at runtime.
 */

import { z } from "zod";
import { NextResponse } from "next/server";

// ========== Reusable helpers ==========

/** Validate a request body against a Zod schema. Returns parsed data or error response. */
export async function validateRequest<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Validation failed",
            details: result.error.flatten().fieldErrors,
          },
          { status: 400 }
        ),
      };
    }
    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}

// ========== Student Schemas ==========

export const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  rollNumber: z.string().min(1, "Roll number is required").max(20),
  departmentId: z.string().min(1, "Department is required"),
  batch: z.string().max(10).optional(),
  semester: z.number().int().min(1).max(10).optional(),
});

export const updateStudentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  rollNumber: z.string().min(1).max(20).optional(),
  departmentId: z.string().min(1).optional(),
  batch: z.string().max(10).optional(),
  semester: z.number().int().min(1).max(10).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// ========== Faculty Schemas ==========

export const createFacultySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  employeeId: z.string().min(1, "Employee ID is required").max(20),
  departmentId: z.string().min(1, "Department is required"),
  designation: z.string().max(100).optional(),
});

// ========== Department Schemas ==========

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().min(1, "Code is required").max(10),
});

// ========== Notice Schemas ==========

export const createNoticeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(5000),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  targetRole: z.enum(["ADMIN", "FACULTY", "STUDENT", "ACCOUNTS"]).nullable().optional(),
});

// ========== Feedback Schemas ==========

export const createFeedbackSchema = z.object({
  type: z.enum(["LECTURE", "PRACTICAL", "EXPERT_GUEST"]),
  subjectName: z.string().min(1, "Subject name is required").max(200),
  facultyName: z.string().min(1, "Faculty name is required").max(200),
  rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  comment: z.string().min(1, "Comment is required").max(2000),
  anonymous: z.boolean().optional(),
});

// ========== Class List Schemas ==========

export const createClassListSchema = z.object({
  name: z.string().min(1, "List name is required").max(100),
  description: z.string().max(500).optional(),
  subjectId: z.string().optional(),
  studentIds: z.array(z.string().min(1)).min(1, "At least 1 student required"),
});

export const updateClassListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  subjectId: z.string().nullable().optional(),
  studentIds: z.array(z.string().min(1)).optional(),
});

// ========== Exam Schemas ==========

export const createExamSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["INTERNAL", "EXTERNAL", "PRACTICAL", "ASSIGNMENT"]),
  date: z.string().min(1, "Date is required"),
  maxMarks: z.number().int().min(1).max(1000).optional(),
  subjectId: z.string().min(1, "Subject is required"),
});

// ========== Marks Schemas ==========

export const uploadMarksSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  marks: z.array(
    z.object({
      studentId: z.string().min(1),
      marksObtained: z.number().min(0).max(1000),
    })
  ).min(1, "At least one mark entry is required"),
});

// ========== Attendance Schemas ==========

export const markAttendanceSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  facultyId: z.string().min(1, "Faculty is required"),
  date: z.string().min(1, "Date is required"),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(["PRESENT", "ABSENT", "LATE"]),
    })
  ).min(1, "At least one record is required"),
});

// ========== Password Change Schema ==========

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(100),
});

// ========== Query param validators ==========

export function validateQueryParam(value: string | null, name: string, maxLen = 100): string | null {
  if (!value) return null;
  if (value.length > maxLen) return null;
  // Strip potentially dangerous characters
  return value.replace(/[<>'"`;]/g, "");
}

export function validatePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, Math.min(1000, parseInt(searchParams.get("page") || "1") || 1));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20") || 20));
  return { page, limit };
}
