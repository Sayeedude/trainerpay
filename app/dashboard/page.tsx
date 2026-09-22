import { getCurrentAppUser } from "@/lib/permissions/current-user";
import { hasPermission } from "@/lib/permissions/roles";

/**
 * Phase 1 dashboard: proves auth + role resolution end-to-end. The real
 * dashboard (current payroll period, headcounts, estimated gross,
 * unresolved exceptions, unallocated classes — spec section 17) needs
 * employees/classes/payroll data that doesn't exist until later phases.
 */
export default async function DashboardPage() {
  const user = await getCurrentAppUser();

  // AppShell (in the layout) already redirects if there's no user, so this
  // is just for TypeScript — user is always non-null by the time we render.
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Phase 1 — authentication and role system are live.</p>
      </div>

      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Signed in as</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{user.email}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{user.role.replace("_", " ")}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Employee record</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {user.employeeId ? "Linked" : "Not linked"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Can run payroll</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {hasPermission(user.role, "RUN_PAYROLL") ? "Yes" : "No"}
          </div>
        </div>
      </div>

      <div className="max-w-3xl rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-relaxed text-slate-600">
        The sidebar only shows what your role is permitted to see — check the{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5">database/policies/role_permission_matrix.md</code> to see
        why. The real payroll/allocation summary cards land in Phase 4.
      </div>
    </div>
  );
}
