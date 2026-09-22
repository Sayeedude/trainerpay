import { describe, expect, it } from "vitest";
import {
  hasAnyPermission,
  hasPermission,
  isRole,
  PERMISSIONS,
  ROLES,
  type Role,
} from "@/lib/permissions/roles";

describe("roles", () => {
  it("recognizes exactly the five spec roles (section 16)", () => {
    expect([...ROLES].sort()).toEqual(
      ["ACADEMIC_MANAGER", "EMPLOYEE", "PAYROLL_ADMIN", "SUPER_ADMIN", "TRAINER"].sort()
    );
  });

  it("isRole rejects unknown strings", () => {
    expect(isRole("SUPER_ADMIN")).toBe(true);
    expect(isRole("super_admin")).toBe(false);
    expect(isRole("HACKER")).toBe(false);
    expect(isRole(undefined)).toBe(false);
    expect(isRole(123)).toBe(false);
  });
});

describe("hasPermission", () => {
  it("returns false for a null/undefined role instead of throwing", () => {
    expect(hasPermission(null, "MANAGE_EMPLOYEES")).toBe(false);
    expect(hasPermission(undefined, "MANAGE_EMPLOYEES")).toBe(false);
  });

  // Spec section 15: "A trainer must never be able to modify their own
  // rate." There is deliberately no permission that grants TRAINER (or
  // EMPLOYEE) write access to pay rates.
  it("never grants TRAINER or EMPLOYEE the ability to manage pay rates", () => {
    expect(hasPermission("TRAINER", "MANAGE_PAY_RATES")).toBe(false);
    expect(hasPermission("EMPLOYEE", "MANAGE_PAY_RATES")).toBe(false);
  });

  // Spec section 15: "A normal employee must never be able to approve
  // payroll."
  it("never grants TRAINER or EMPLOYEE payroll approval or finalisation", () => {
    for (const role of ["TRAINER", "EMPLOYEE"] as Role[]) {
      expect(hasPermission(role, "APPROVE_PAYROLL")).toBe(false);
      expect(hasPermission(role, "FINALISE_PAYROLL")).toBe(false);
      expect(hasPermission(role, "RUN_PAYROLL")).toBe(false);
    }
  });

  // Spec section 16: ACADEMIC_MANAGER "should not have unrestricted ability
  // to modify payroll rates unless explicitly granted."
  it("does not grant ACADEMIC_MANAGER pay rate management by default", () => {
    expect(hasPermission("ACADEMIC_MANAGER", "MANAGE_PAY_RATES")).toBe(false);
  });

  it("grants SUPER_ADMIN and PAYROLL_ADMIN full payroll control", () => {
    for (const role of ["SUPER_ADMIN", "PAYROLL_ADMIN"] as Role[]) {
      expect(hasPermission(role, "RUN_PAYROLL")).toBe(true);
      expect(hasPermission(role, "APPROVE_PAYROLL")).toBe(true);
      expect(hasPermission(role, "FINALISE_PAYROLL")).toBe(true);
      expect(hasPermission(role, "MANAGE_PAY_RATES")).toBe(true);
    }
  });

  it("only SUPER_ADMIN can manage settings", () => {
    for (const role of ["PAYROLL_ADMIN", "ACADEMIC_MANAGER", "TRAINER", "EMPLOYEE"] as Role[]) {
      expect(hasPermission(role, "MANAGE_SETTINGS")).toBe(false);
    }
    expect(hasPermission("SUPER_ADMIN", "MANAGE_SETTINGS")).toBe(true);
  });

  it("every role can view its own payroll and request its own leave", () => {
    for (const role of ROLES) {
      expect(hasPermission(role, "VIEW_OWN_PAYROLL")).toBe(true);
      expect(hasPermission(role, "REQUEST_OWN_LEAVE")).toBe(true);
    }
  });
});

describe("hasAnyPermission", () => {
  it("returns true if the role holds at least one of the listed permissions", () => {
    expect(hasAnyPermission("TRAINER", ["MANAGE_PAY_RATES", "VIEW_OWN_PAYROLL"])).toBe(true);
    expect(hasAnyPermission("TRAINER", ["MANAGE_PAY_RATES", "RUN_PAYROLL"])).toBe(false);
  });
});

describe("PERMISSIONS table", () => {
  it("every permission grants at least one role (no dead permissions)", () => {
    for (const [permission, roles] of Object.entries(PERMISSIONS)) {
      expect(roles.length, `${permission} grants no roles`).toBeGreaterThan(0);
    }
  });

  it("every role listed against every permission is a real role", () => {
    for (const roles of Object.values(PERMISSIONS)) {
      for (const role of roles) {
        expect((ROLES as readonly string[]).includes(role)).toBe(true);
      }
    }
  });
});
