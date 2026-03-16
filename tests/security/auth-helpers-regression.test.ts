import test from "node:test";
import assert from "node:assert/strict";
import { canAccessFaculty, canAccessStudent } from "../../src/lib/auth-helpers";

const studentSession = {
  userId: "u_student",
  role: "STUDENT",
  studentId: "stu_1",
  facultyId: null,
  department: "CE",
  email: "student@tsec.edu",
  name: "Student",
};

const facultySession = {
  userId: "u_faculty",
  role: "FACULTY",
  studentId: null,
  facultyId: "fac_1",
  department: "CE",
  email: "faculty@tsec.edu",
  name: "Faculty",
};

const adminSession = {
  userId: "u_admin",
  role: "ADMIN",
  studentId: null,
  facultyId: null,
  department: null,
  email: "admin@tsec.edu",
  name: "Admin",
};

test("student access is limited to own student record", () => {
  assert.equal(canAccessStudent(studentSession, "stu_1"), true);
  assert.equal(canAccessStudent(studentSession, "stu_2"), false);
});

test("faculty and admin can access student records", () => {
  assert.equal(canAccessStudent(facultySession, "stu_1"), true);
  assert.equal(canAccessStudent(adminSession, "stu_99"), true);
});

test("faculty access is limited to own faculty record unless admin", () => {
  assert.equal(canAccessFaculty(facultySession, "fac_1"), true);
  assert.equal(canAccessFaculty(facultySession, "fac_2"), false);
  assert.equal(canAccessFaculty(adminSession, "fac_2"), true);
});

