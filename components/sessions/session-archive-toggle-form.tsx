import { archiveSessionAction, restoreSessionAction } from "@/app/sessions/actions";

type SessionArchiveToggleFormProps = {
  isArchived: boolean;
  sessionId: string;
  treatmentPlanId: string;
};

export function SessionArchiveToggleForm({
  isArchived,
  sessionId,
  treatmentPlanId,
}: SessionArchiveToggleFormProps) {
  const action = isArchived ? restoreSessionAction : archiveSessionAction;

  return (
    <form action={action}>
      <input name="sessionId" type="hidden" value={sessionId} />
      <input name="treatmentPlanId" type="hidden" value={treatmentPlanId} />
      <button className="button button-management" type="submit">
        {isArchived ? "Restore" : "Archive"}
      </button>
    </form>
  );
}
