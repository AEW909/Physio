import Link from "next/link";
import { getAcupunctureConsentStatusLabel } from "@/lib/acupuncture-consents/queries";
import type { AcupunctureConsentWithPatient } from "@/lib/acupuncture-consents/types";

type AcupunctureConsentQueueProps = {
  items: AcupunctureConsentWithPatient[];
};

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 7) return `Updated ${diffDays} days ago`;

  return `Updated ${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)}`;
}

function getStatusTone(status: AcupunctureConsentWithPatient["status"]) {
  switch (status) {
    case "submitted":
      return "status-pill status-pill-warning";
    default:
      return "status-pill";
  }
}

export function AcupunctureConsentQueue({ items }: AcupunctureConsentQueueProps) {
  return (
    <article className="card dashboard-list-card">
      <div className="dashboard-section-heading">
        <div>
          <p className="eyebrow">Outstanding</p>
          <h2>Acupuncture consents</h2>
          <p className="dashboard-section-note">Outstanding patient submissions and clinician reviews in your current caseload.</p>
        </div>
      </div>

      {items.length ? (
        <div className="dashboard-list">
          {items.map((item) => (
            <Link className="dashboard-list-row" href={`/patients/${item.patient_id}`} key={item.id}>
              <div>
                <h3>{item.patient ? `${item.patient.first_name} ${item.patient.last_name}` : "Patient unavailable"}</h3>
                <p>{formatRelativeDate(item.updated_at)}</p>
              </div>
              <div className="dashboard-row-meta">
                <span className={getStatusTone(item.status)}>{getAcupunctureConsentStatusLabel(item.status)}</span>
                <p>Open</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="dashboard-empty-state">
          No outstanding acupuncture consent forms right now. New requests and review queues will appear here.
        </p>
      )}
    </article>
  );
}
