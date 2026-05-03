import Link from "next/link";
import type { AppointmentListItem } from "@/lib/appointments/types";

type AppointmentListProps = {
  appointments: AppointmentListItem[];
};

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatStatus(status: AppointmentListItem["status"]) {
  return status.replace("_", " ");
}

export function AppointmentList({ appointments }: AppointmentListProps) {
  return (
    <section className="card stack">
      <div className="split-header">
        <div>
          <h2>Previous sessions</h2>
          <p className="lede">
            {appointments.length
              ? `${appointments.length} session record${appointments.length === 1 ? "" : "s"} linked to this patient.`
              : "No prior sessions recorded yet."}
          </p>
        </div>
      </div>

      {appointments.length ? (
        <div className="patient-list">
          {appointments.map((appointment) => (
            <Link className="patient-row" href={`/sessions/${appointment.id}`} key={appointment.id}>
              <div>
                <h3>{appointment.appointment_type}</h3>
                <p>{formatDateTime(appointment.scheduled_at)}</p>
              </div>
              <div className="patient-row-meta">
                <span className="status-pill">{formatStatus(appointment.status)}</span>
                <span>{appointment.location || "No location"}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
