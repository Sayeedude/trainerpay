import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/permissions/current-user";
import { hasPermission } from "@/lib/permissions/roles";
import { NAV_ITEMS } from "./nav-items";
import { SignOutButton } from "./sign-out-button";

/**
 * Shared authenticated shell: sidebar nav (filtered by role/permission) +
 * top bar showing who's signed in as what role. Visual reference is the
 * TrainerPay prototype's sidebar; this is Phase 1's functional skeleton,
 * not the finished screens — those land in Phases 2-5.
 *
 * middleware.ts already redirects signed-out requests to /login, but this
 * re-checks server-side (defense in depth, and it needs the user anyway to
 * render the role-filtered nav).
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/login");
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.permission || hasPermission(user.role, item.permission));

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="w-60 shrink-0 bg-slate-900 px-4 py-6 text-slate-200">
        <div className="mb-8 px-2 text-xl font-extrabold text-white">TrainerPay</div>
        <nav className="flex flex-col gap-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-900">{user.email}</span>{" "}
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {user.role.replace("_", " ")}
            </span>
          </div>
          <SignOutButton />
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
