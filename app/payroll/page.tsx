import { PhasePending } from "@/components/ui/phase-pending";

export default function PayrollPage() {
  return (
    <PhasePending
      title="Fortnightly Payroll"
      phase="Phase 4"
      description="calculatePayroll(periodId): allocation + leave + cover + rates → payroll lines and exceptions, review, approval, and finalisation for the current period (7–20 Sep 2026)."
    />
  );
}
