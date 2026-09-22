import { PhasePending } from "@/components/ui/phase-pending";

export default function SettingsPage() {
  return (
    <PhasePending
      title="Contract Rules"
      phase="Phase 2"
      description="Configure pay rules (classification, hourly rate, teacher multiplier) without hard-coding them into payroll — this becomes the pay_rates admin screen."
    />
  );
}
