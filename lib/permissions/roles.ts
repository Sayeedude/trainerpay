/**
 * Application role system (spec section 16).
 *
 * This mirrors the `user_role` Postgres enum (database/migrations/0001_...)
 * and the RLS policies in 0007-0009. It exists so server components, API
 * routes, and UI can make the same role decisions without a round trip —
 * but it is a UX/defense-in-depth layer, NOT the security boundary. Row
 * Level Security in the database is the actual enforcement; see
 * database/policies/role_permission_matrix.md.
 */

export const ROLES = [
  "SUPER_ADMIN",
  "PAYROLL_ADMIN",
  "ACADEMIC_MANAGER",
  "TRAINER",
  "EMPLOYEE",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Permissions this app currently checks in code (route guards, nav
 * visibility, etc). Each maps to one or more roles that hold it. Keep this
 * in sync with the RLS matrix — if a permission here would allow something
 * RLS denies, RLS wins and the user just sees an empty result / error, so
 * drift is a bug even though it isn't a security hole.
 */
export const PERMISSIONS = {
  MANAGE_EMPLOYEES: ["SUPER_ADMIN", "PAYROLL_ADMIN"],
  MANAGE_PAY_RATES: ["SUPER_ADMIN", "PAYROLL_ADMIN"],
  VIEW_ALL_EMPLOYEES: ["SUPER_ADMIN", "PAYROLL_ADMIN", "ACADEMIC_MANAGER"],

  MANAGE_CLASS_ALLOCATION: ["SUPER_ADMIN", "ACADEMIC_MANAGER"],
  APPROVE_LEAVE: ["SUPER_ADMIN", "PAYROLL_ADMIN", "ACADEMIC_MANAGER"],
  ASSIGN_COVER: ["SUPER_ADMIN", "PAYROLL_ADMIN", "ACADEMIC_MANAGER"],
  REQUEST_OWN_LEAVE: ["SUPER_ADMIN", "PAYROLL_ADMIN", "ACADEMIC_MANAGER", "TRAINER", "EMPLOYEE"],

  VIEW_PAYROLL_ALL: ["SUPER_ADMIN", "PAYROLL_ADMIN", "ACADEMIC_MANAGER"],
  RUN_PAYROLL: ["SUPER_ADMIN", "PAYROLL_ADMIN"],
  APPROVE_PAYROLL: ["SUPER_ADMIN", "PAYROLL_ADMIN"],
  FINALISE_PAYROLL: ["SUPER_ADMIN", "PAYROLL_ADMIN"],
  VIEW_OWN_PAYROLL: ["SUPER_ADMIN", "PAYROLL_ADMIN", "ACADEMIC_MANAGER", "TRAINER", "EMPLOYEE"],

  VIEW_AUDIT_LOG: ["SUPER_ADMIN", "PAYROLL_ADMIN"],
  MANAGE_SETTINGS: ["SUPER_ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function hasAnyPermission(role: Role | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** Default landing route once signed in, per role. */
export function defaultRouteForRole(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "PAYROLL_ADMIN":
      return "/dashboard";
    case "ACADEMIC_MANAGER":
      return "/allocation";
    case "TRAINER":
    case "EMPLOYEE":
      return "/dashboard";
  }
}
