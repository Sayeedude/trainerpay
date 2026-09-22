import { PhasePending } from "@/components/ui/phase-pending";

export default function EmployeesPage() {
  return (
    <PhasePending
      title="Employees"
      phase="Phase 2"
      description="Employee records, classifications, and historical pay rates — imported from the TrainerPay workbook, with Travis Jenkins' missing rate flagged as an exception rather than guessed."
    />
  );
}
