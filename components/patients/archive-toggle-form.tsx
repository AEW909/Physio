import { archivePatientAction, restorePatientAction } from "@/app/patients/actions";

type ArchiveToggleFormProps = {
  isArchived: boolean;
  patientId: string;
};

export function ArchiveToggleForm({ isArchived, patientId }: ArchiveToggleFormProps) {
  const action = isArchived ? restorePatientAction : archivePatientAction;

  return (
    <form action={action}>
      <input name="patientId" type="hidden" value={patientId} />
      <button className="button button-management" type="submit">
        {isArchived ? "Restore patient" : "Archive patient"}
      </button>
    </form>
  );
}
