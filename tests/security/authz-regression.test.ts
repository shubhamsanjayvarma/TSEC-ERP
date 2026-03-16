import test from "node:test";
import assert from "node:assert/strict";
import {
  canFacultyActForFacultyId,
  canFacultyManageAssignedSubject,
  canRoleAccessDashboardStats,
  canRoleSeeNotice,
} from "../../src/lib/authz";

test("faculty cannot act as another faculty account", () => {
  assert.equal(canFacultyActForFacultyId("fac_1", "fac_1"), true);
  assert.equal(canFacultyActForFacultyId("fac_1", "fac_2"), false);
  assert.equal(canFacultyActForFacultyId(null, "fac_1"), false);
});

test("faculty can only manage assigned subjects", () => {
  assert.equal(canFacultyManageAssignedSubject("fac_1", ["fac_1"]), true);
  assert.equal(canFacultyManageAssignedSubject("fac_1", ["fac_2", "fac_3"]), false);
  assert.equal(canFacultyManageAssignedSubject(null, ["fac_1"]), false);
});

test("students are blocked from aggregate dashboard stats", () => {
  assert.equal(canRoleAccessDashboardStats("STUDENT"), false);
  assert.equal(canRoleAccessDashboardStats("ADMIN"), true);
  assert.equal(canRoleAccessDashboardStats("FACULTY"), true);
  assert.equal(canRoleAccessDashboardStats("ACCOUNTS"), true);
});

test("notice visibility is role-scoped", () => {
  assert.equal(canRoleSeeNotice(null, "STUDENT"), true);
  assert.equal(canRoleSeeNotice("STUDENT", "STUDENT"), true);
  assert.equal(canRoleSeeNotice("ADMIN", "STUDENT"), false);
  assert.equal(canRoleSeeNotice("FACULTY", "ADMIN"), false);
});

