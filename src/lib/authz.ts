export function canFacultyActForFacultyId(
  sessionFacultyId: string | null,
  requestedFacultyId: string
): boolean {
  return Boolean(sessionFacultyId && sessionFacultyId === requestedFacultyId);
}

export function canFacultyManageAssignedSubject(
  sessionFacultyId: string | null,
  assignedFacultyIds: string[]
): boolean {
  if (!sessionFacultyId) return false;
  return assignedFacultyIds.includes(sessionFacultyId);
}

export function canRoleAccessDashboardStats(role: string): boolean {
  return role !== "STUDENT";
}

export function canRoleSeeNotice(targetRole: string | null, userRole: string): boolean {
  return targetRole === null || targetRole === userRole;
}

