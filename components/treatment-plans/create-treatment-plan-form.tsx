import { TreatmentPlanForm } from "@/components/treatment-plans/treatment-plan-form";

type CreateTreatmentPlanFormProps = {
  patientId: string;
};

export function CreateTreatmentPlanForm({ patientId }: CreateTreatmentPlanFormProps) {
  return <TreatmentPlanForm mode="create" patientId={patientId} />;
}
