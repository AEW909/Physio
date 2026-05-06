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

function formatYesNo(value: "yes" | "no" | null) {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return "Not answered";
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
  const internalConsentPath = currentConsent ? `/consents/acupuncture/${currentConsent.token}` : null;
  const consentLink = currentConsent ? `${getBaseUrl()}consents/acupuncture/${currentConsent.token}` : null;
  const mailtoHref =
    currentConsent && patient.email
      ? `mailto:${encodeURIComponent(patient.email)}?subject=${encodeURIComponent("Your acupuncture consent form")}&body=${encodeURIComponent(
          `Hello ${patient.first_name},\n\nPlease complete your acupuncture consent form here:\n${consentLink}\n\nThank you,\nHarris Physiotherapy`,
        )}`
      : null;

  return (
    <details className="plan-panel">
      <summary className="plan-summary-bar">
        <div className="plan-summary-main">
          <span aria-hidden="true" className="plan-toggle-icon" />
        </div>
        <div>
          <h3>Acupuncture consent</h3>
          <p>
            {currentConsent
              ? "Generate the public form, track submission, and review the completed consent."
              : "No acupuncture consent request has been generated for this patient yet."}
          </p>
        </div>
        {currentConsent ? (
          <div className="plan-summary-meta">
            <span className={getStatusTone(currentConsent.status)}>
              {getAcupunctureConsentStatusLabel(currentConsent.status)}
            </span>
          </div>
        ) : null}
      </summary>

      <div className="plan-panel-body stack">
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
                    <a
                      className="button button-secondary"
                      href={internalConsentPath ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
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
                    <div>
                      <dt>Further screening information</dt>
                      <dd>{currentConsent.screening_notes || "No further information provided."}</dd>
                    </div>
                  </dl>

                  <form action={reviewAcupunctureConsentAction} className="stack">
                    <input type="hidden" name="patientId" value={patient.id} />
                    <input type="hidden" name="consentId" value={currentConsent.id} />
                    <label className="field">
                      <span>Clinical reasoning</span>
                      <textarea
                        name="clinicianReviewNotes"
                        rows={4}
                        placeholder="Record any restrictions, concerns, or reasons for rejecting treatment."
                        defaultValue={currentConsent.clinician_review_notes ?? ""}
                      />
                    </label>
                    <div className="workspace-actions consent-review-actions">
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
                  Treatment has been approved. The submitted screening and consent details remain below for reference.
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

        {currentConsent && currentConsent.status !== "generated" ? (
          <section className="card stack consent-panel-nested">
            <div className="split-header">
              <div>
                <h3>Submitted form</h3>
                <p className="lede">Stored on the patient profile for reference and review history.</p>
              </div>
              <span className={getStatusTone(currentConsent.status)}>
                {getAcupunctureConsentStatusLabel(currentConsent.status)}
              </span>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Date of birth</dt>
                <dd>{formatDate(currentConsent.patient_date_of_birth)}</dd>
              </div>
              <div>
                <dt>Treatment explained</dt>
                <dd>{currentConsent.understands_treatment ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt>Risks understood</dt>
                <dd>{currentConsent.understands_risks ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt>Relevant history disclosed</dt>
                <dd>{currentConsent.disclosed_relevant_history ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt>History notes</dt>
                <dd>{currentConsent.history_notes || "No additional notes provided."}</dd>
              </div>
              <div>
                <dt>Further screening information</dt>
                <dd>{currentConsent.screening_notes || "No further information provided."}</dd>
              </div>
              <div>
                <dt>Consent to treatment</dt>
                <dd>{currentConsent.consent_to_treatment ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt>Signature</dt>
                <dd>{currentConsent.signature_name || "Not recorded"}</dd>
              </div>
              <div>
                <dt>Diabetes</dt>
                <dd>{formatYesNo(currentConsent.diabetes_response)}</dd>
              </div>
              <div>
                <dt>Epileptic seizure history</dt>
                <dd>{formatYesNo(currentConsent.epileptic_seizure_response)}</dd>
              </div>
              <div>
                <dt>History of fainting</dt>
                <dd>{formatYesNo(currentConsent.fainted_response)}</dd>
              </div>
              <div>
                <dt>Heart problems</dt>
                <dd>{formatYesNo(currentConsent.heart_problem_response)}</dd>
              </div>
              <div>
                <dt>Pacemaker / electrical implant</dt>
                <dd>{formatYesNo(currentConsent.pacemaker_response)}</dd>
              </div>
              <div>
                <dt>Circulation / clotting problems</dt>
                <dd>{formatYesNo(currentConsent.circulation_problem_response)}</dd>
              </div>
              <div>
                <dt>Anticoagulation therapy</dt>
                <dd>{formatYesNo(currentConsent.anticoagulation_response)}</dd>
              </div>
              <div>
                <dt>Cancer history</dt>
                <dd>{formatYesNo(currentConsent.cancer_response)}</dd>
              </div>
              <div>
                <dt>Blood borne viruses</dt>
                <dd>{formatYesNo(currentConsent.blood_borne_virus_response)}</dd>
              </div>
              <div>
                <dt>Allergies to metal or alcohol wipes</dt>
                <dd>{formatYesNo(currentConsent.allergy_response)}</dd>
              </div>
              <div>
                <dt>Pregnant / trying to conceive</dt>
                <dd>{formatYesNo(currentConsent.pregnant_response)}</dd>
              </div>
              <div>
                <dt>Needle phobia</dt>
                <dd>{formatYesNo(currentConsent.needle_phobia_response)}</dd>
              </div>
              <div>
                <dt>Prior adverse effect to needling</dt>
                <dd>{formatYesNo(currentConsent.prior_needling_adverse_effect_response)}</dd>
              </div>
              <div>
                <dt>Eaten within 2 hours</dt>
                <dd>{formatYesNo(currentConsent.eaten_within_two_hours_response)}</dd>
              </div>
              <div>
                <dt>Clinician review notes</dt>
                <dd>{currentConsent.clinician_review_notes || "No clinician review notes recorded."}</dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>
    </details>
  );
}
