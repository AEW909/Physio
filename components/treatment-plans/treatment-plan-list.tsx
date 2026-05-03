import Link from "next/link";
import type { TreatmentPlanSessionItem, TreatmentPlanWithSessions } from "@/lib/treatment-plans/types";

type TreatmentPlanListProps = {
  plans: TreatmentPlanWithSessions[];
  title?: string;
  description?: string;
  showSessionActions?: boolean;
};

type PlanSessionListProps = {
  sessions: TreatmentPlanSessionItem[];
  title?: string;
  description?: string;
};

function formatDateTime(date: string | null) {
  if (!date) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function PlanSessionList({
  sessions,
  title = "Sessions",
  description,
}: PlanSessionListProps) {
  return (
    <section className="card stack">
      <div className="split-header">
        <div>
          <h2>{title}</h2>
          <p className="lede">
            {description ??
              (sessions.length
                ? `${sessions.length} session${sessions.length === 1 ? "" : "s"} recorded in this treatment plan.`
                : "No sessions recorded yet for this treatment plan.")}
          </p>
        </div>
      </div>

      {sessions.length ? (
        <div className="patient-list">
          {sessions.map((session) => (
            <article className="patient-row" key={session.id}>
              <div>
                <Link className="patient-row-link" href={session.note_id ? `/notes/${session.note_id}` : `/sessions/${session.id}`}>
                  <h3>{session.note_title || session.appointment_type}</h3>
                </Link>
                <p>{formatDateTime(session.scheduled_at)}</p>
              </div>
              <div className="patient-row-meta">
                <span className="status-pill">{(session.note_type || "session").replaceAll("_", " ")}</span>
                <span>{session.location || "No location"}</span>
                <Link className="button button-secondary button-small" href={session.note_id ? `/notes/${session.note_id}` : `/sessions/${session.id}`}>
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function TreatmentPlanList({
  plans,
  title = "Treatment plans",
  description,
}: TreatmentPlanListProps) {
  if (!plans.length) {
    return (
      <article className="card">
        <h2>No treatment plans yet</h2>
        <p>Create the first treatment plan to start grouping sessions by problem area or episode of care.</p>
      </article>
    );
  }

  return (
    <section className="card stack">
      <div className="split-header">
        <div>
          <h2>{title}</h2>
          <p className="lede">
            {description ?? `${plans.length} treatment plan${plans.length === 1 ? "" : "s"} linked to this patient.`}
          </p>
        </div>
      </div>

      <div className="plan-list">
        {plans.map((plan) => (
          <details className="plan-panel" key={plan.id}>
            <summary className="plan-summary-bar">
              <div className="plan-summary-main">
                <span aria-hidden="true" className="plan-toggle-icon" />
              </div>
              <div>
                <h3>{plan.title}</h3>
                <p>
                  {plan.status.replace("_", " ")} · First session {formatDateTime(plan.first_session_at)}
                </p>
              </div>
              <div className="plan-summary-meta">
                <span className="status-pill">{plan.status.replace("_", " ")}</span>
                <span>{plan.sessions.length} session{plan.sessions.length === 1 ? "" : "s"}</span>
              </div>
            </summary>

            <div className="plan-panel-body stack">
              <div className="plan-panel-grid">
                <section className="card stack">
                  <h2>Plan summary</h2>
                  <dl className="detail-list">
                    <div>
                      <dt>Overall findings</dt>
                      <dd>{plan.overall_findings || "No overall findings summary yet."}</dd>
                    </div>
                    <div>
                      <dt>Goals</dt>
                      <dd>{plan.goals_summary || "Goals summary will be added after the initial assessment."}</dd>
                    </div>
                    <div>
                      <dt>Progress summary</dt>
                      <dd>{plan.progress_summary || "Progress summary will build up across follow-up sessions."}</dd>
                    </div>
                  </dl>
                </section>

                <section className="card stack plan-actions-card">
                  <h2>Actions</h2>
                  <div className="workspace-actions">
                    <Link className="button button-secondary" href={`/treatment-plans/${plan.id}`}>
                      Open plan
                    </Link>
                    {!plan.is_archived && plan.status !== "completed" && plan.sessions.length ? (
                      <Link className="button button-primary" href={`/treatment-plans/${plan.id}/sessions/new`}>
                        Add follow-up
                      </Link>
                    ) : !plan.is_archived && plan.status !== "completed" ? (
                      <Link className="button button-primary" href={`/treatment-plans/${plan.id}/sessions/new`}>
                        Start initial assessment
                      </Link>
                    ) : null}
                    {plan.status === "completed" ? (
                      <span className="status-pill">Completed plan</span>
                    ) : null}
                    {plan.is_archived ? (
                      <span className="status-pill">Archived plan</span>
                    ) : null}
                  </div>
                </section>
              </div>

              <PlanSessionList sessions={plan.sessions} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
