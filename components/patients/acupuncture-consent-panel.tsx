import { createAcupunctureConsentRequestAction, reviewAcupunctureConsentAction } from "@/app/acupuncture-consents/actions";
import { getAcupunctureConsentStatusLabel } from "@/lib/acupuncture-consents/queries";
import type { AcupunctureConsentRecord } from "@/lib/acupuncture-consents/types";
import { getBaseUrl } from "@/lib/site-url";
import type { PatientDetail } from "@/lib/patients/types";

type AcupunctureConsentPanelProps = {
  patient: PatientDetail;
  consents: AcupunctureConsentRecord[];
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

function formatDate(date: string | null) {
  if (!date) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusTone(status: AcupunctureConsentRecord["status"]) {
  switch (status) {
    case "approved":
      return "status-pill status-pill-success";
    case "rejected":
      return "status-pill status-pill-alert";
    case "submitted":
      return "status-pill status-pill-warning";
    default:
      return "status-pill";
  }
}

export function AcupunctureConsentPanel({ patient, consents }: AcupunctureConsentPanelProps) {
  const currentConsent = consents[0] ?? null;
  const completedConsents = consents.filter((consent) => consent.status !== "generated");
  const consentLink = currentConsent ? `${getBaseUrl()}consents/acupuncture/${currentConsent.token}` : null;
  const mailtoHref =
    currentConsent && patient.email
      ? `mailto:${encodeURIComponent(patient.email)}?subject=${encodeURIComponent("Your acupuncture consent form")}&body=${encodeURIComponent(
          `Hello ${patient.first_name},\n\nPlease complete your acupuncture consent form here:\n${consentLink}\n\nThank you,\nHarris Physiotherapy`,
        )}`
      : null;

  return (
    <>
      <section className="card stack">
        <div className="split-header">
          <div>
            <h2>Acupuncture consent</h2>
            <p className="lede">
              Generate a patient link, wait for submission, then review and approve or reject treatment.
            </p>
          </div>
          <form action={createAcupunctureConsentRequestAction}>
            <input type="hidden" name="patientId" value={patient.id} />
            <button className="button button-primary" type="submit">
              Generate consent link
            </button>
          </form>
        </div>

        {currentConsent ? (
          <div className="consent-panel-grid">
            <section className="card stack consent-panel-nested">
              <div className="split-header">
                <div>
                  <h3>Current request</h3>
                  <p className="lede">Latest generated consent request for this patient.</p>
                </div>
                <span className={getStatusTone(currentConsent.status)}>
                  {getAcupunctureConsentStatusLabel(currentConsent.status)}
                </span>
              </div>

              <dl className="detail-list">
                <div>
                  <dt>Generated</dt>
                  <dd>{formatDateTime(currentConsent.created_at)}</dd>
                </div>
                <div>
                  <dt>Submitted</dt>
                  <dd>{formatDateTime(currentConsent.submitted_at)}</dd>
                </div>
                <div>
                  <dt>Reviewed</dt>
                  <dd>{formatDateTime(currentConsent.reviewed_at)}</dd>
                </div>
              </dl>

              {consentLink ? (
                <div className="stack">
                  <label className="field">
                    <span>Shareable patient link</span>
                    <input readOnly value={consentLink} />
                  </label>
                  <div className="workspace-actions">
                    <a className="button button-secondary" href={consentLink} target="_blank" rel="noreferrer">
                      Open public form
                    </a>
                    {mailtoHref ? (
                      <a className="button button-secondary" href={mailtoHref}>
                        Email link
                      </a>
                    ) : (
                      <span className="status-pill">No patient email recorded</span>
                    )}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="card stack consent-panel-nested">
              <h3>Clinician review</h3>
              {currentConsent.status === "submitted" ? (
                <>
                  <dl className="detail-list">
                    <div>
                      <dt>Patient name</dt>
                      <dd>{currentConsent.patient_full_name || "Not recorded"}</dd>
                    </div>
                    <div>
                      <dt>Date of birth</dt>
                      <dd>{formatDate(currentConsent.patient_date_of_birth)}</dd>
                    </div>
                    <div>
                      <dt>Medical history notes</dt>
                      <dd>{currentConsent.history_notes || "No additional notes provided."}</dd>
                    </div>
                  </dl>

                  <form action={reviewAcupunctureConsentAction} className="stack">
                    <input type="hidden" name="patientId" value={patient.id} />
                    <input type="hidden" name="consentId" value={currentConsent.id} />
                    <label className="field">
                      <span>Review notes</span>
                      <textarea
                        name="clinicianReviewNotes"
                        rows={4}
                        placeholder="Record any restrictions, concerns, or reasons for rejecting treatment."
                        defaultValue={currentConsent.clinician_review_notes ?? ""}
                      />
                    </label>
                    <div className="workspace-actions">
                      <button className="button button-primary" name="decision" type="submit" value="approved">
                        Approve treatment
                      </button>
                      <button className="button button-danger" name="decision" type="submit" value="rejected">
                        Reject treatment
                      </button>
                    </div>
                  </form>
                </>
              ) : currentConsent.status === "approved" ? (
                <p className="lede">
                  Treatment has been approved. A completed copy remains available below for reference.
                </p>
              ) : currentConsent.status === "rejected" ? (
                <p className="lede">
                  Treatment has been rejected. Generate a fresh consent request if the patient needs to resubmit after review.
                </p>
              ) : (
                <p className="lede">Waiting for the patient to complete and submit the public consent form.</p>
              )}
            </section>
          </div>
        ) : (
          <p className="dashboard-empty-state">
            No acupuncture consent request has been generated yet for this patient.
          </p>
        )}
      </section>

      {completedConsents.length ? (
        <details className="plan-panel">
          <summary className="plan-summary-bar">
            <div className="plan-summary-main">
              <span aria-hidden="true" className="plan-toggle-icon" />
            </div>
            <div>
              <h3>Submitted consent forms</h3>
              <p>
                {completedConsents.length} submitted consent form{completedConsents.length === 1 ? "" : "s"} stored on
                this profile.
              </p>
            </div>
          </summary>
          <div className="plan-panel-body stack">
            {completedConsents.map((consent) => (
              <section className="card stack consent-panel-nested" key={consent.id}>
                <div className="split-header">
                  <div>
                    <h3>{consent.patient_full_name || `${patient.first_name} ${patient.last_name}`}</h3>
                    <p className="lede">Submitted {formatDateTime(consent.submitted_at)}</p>
                  </div>
                  <span className={getStatusTone(consent.status)}>
                    {getAcupunctureConsentStatusLabel(consent.status)}
                  </span>
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>Date of birth</dt>
                    <dd>{formatDate(consent.patient_date_of_birth)}</dd>
                  </div>
                  <div>
                    <dt>Treatment explained</dt>
                    <dd>{consent.understands_treatment ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Risks understood</dt>
                    <dd>{consent.understands_risks ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Relevant history disclosed</dt>
                    <dd>{consent.disclosed_relevant_history ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>History notes</dt>
                    <dd>{consent.history_notes || "No additional notes provided."}</dd>
                  </div>
                  <div>
                    <dt>Consent to treatment</dt>
                    <dd>{consent.consent_to_treatment ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Signature</dt>
                    <dd>{consent.signature_name || "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>Clinician review notes</dt>
                    <dd>{consent.clinician_review_notes || "No clinician review notes recorded."}</dd>
                  </div>
                </dl>
              </section>
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}
