import type { Permission } from "@/lib/permissions/roles";

export interface NavItem {
  href: string;
  label: string;
  /** Omit for "visible to any signed-in user". */
  permission?: Permission;
}

/** Main navigation, per spec section 17. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employees", label: "Employees", permission: "VIEW_ALL_EMPLOYEES" },
  { href: "/allocation", label: "Class Allocation" },
  { href: "/hours", label: "Hours & Classes" },
  { href: "/payroll", label: "Fortnightly Payroll", permission: "VIEW_OWN_PAYROLL" },
  { href: "/reports", label: "Reports", permission: "VIEW_PAYROLL_ALL" },
  { href: "/settings", label: "Contract Rules", permission: "MANAGE_SETTINGS" },
];
