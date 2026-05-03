import { archiveTreatmentPlanAction, restoreTreatmentPlanAction } from "@/app/treatment-plans/actions";

type TreatmentPlanArchiveToggleFormProps = {
  isArchived: boolean;
  patientId: string;
  planId: string;
};

export function TreatmentPlanArchiveToggleForm({
  isArchived,
  patientId,
  planId,
}: TreatmentPlanArchiveToggleFormProps) {
  const action = isArchived ? restoreTreatmentPlanAction : archiveTreatmentPlanAction;

  return (
    <form action={action}>
      <input name="planId" type="hidden" value={planId} />
      <input name="patientId" type="hidden" value={patientId} />
      <button className="button button-management" type="submit">
        {isArchived ? "Restore plan" : "Archive plan"}
      </button>
    </form>
  );
}
