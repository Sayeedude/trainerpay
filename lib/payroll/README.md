# lib/payroll

Empty in Phase 1 on purpose. This is where `calculatePayroll(periodId)`
(spec section 18) and its supporting rules (multiplier, leave/cover
handling, admin-teaching exclusion, contract variance checks) will live in
Phase 4, once there's real allocation/leave/cover data (Phases 2-3) for it
to operate on. Keeping payroll logic out of React components, in this
directory, is a hard requirement of the spec — don't reach for shortcuts
later that put calculation logic in a component or API route instead.
