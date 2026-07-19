// src/lib/permissions.ts
// Centralized role-based permission checks.
// Import and use these helpers instead of scattering role strings across actions.
//
// FAIL CLOSED: a null user (unauthenticated, unlinked, or a Clerk lookup error)
// is denied everything. The callers must establish a real DB user before
// granting access — never rely on these helpers to "allow in dev".

export type UserRole =
  | "PROJECT_MANAGER"
  | "SENIOR_PM"
  | "OFFICE_ADMIN"
  | "OPS_MANAGER"
  | "SYSTEM_ADMIN";

interface RoleHolder {
  role: string;
}

/** PROJECT_MANAGERs see only their own projects; all other roles see all. */
export function canSeeAllProjects(user: RoleHolder | null): boolean {
  if (!user) return false;
  return user.role !== "PROJECT_MANAGER";
}

/** Only admin/ops roles may edit the product catalog. */
export function canEditProductCatalog(user: RoleHolder | null): boolean {
  if (!user) return false;
  return ["SYSTEM_ADMIN", "OPS_MANAGER", "OFFICE_ADMIN"].includes(user.role);
}

/** Only SYSTEM_ADMIN and OPS_MANAGER may manage user accounts. */
export function canManageUsers(user: RoleHolder | null): boolean {
  if (!user) return false;
  return ["SYSTEM_ADMIN", "OPS_MANAGER"].includes(user.role);
}

/** Only admin/ops/senior PMs may delete projects. */
export function canDeleteProject(user: RoleHolder | null): boolean {
  if (!user) return false;
  return ["SYSTEM_ADMIN", "OPS_MANAGER", "SENIOR_PM"].includes(user.role);
}

/** Whether a user may update another user's default markup. */
export function canUpdateMarkup(
  currentUser: (RoleHolder & { id: string }) | null,
  targetUserId: string
): boolean {
  if (!currentUser) return false;
  if (currentUser.id === targetUserId) return true;
  return ["SYSTEM_ADMIN", "OPS_MANAGER"].includes(currentUser.role);
}
