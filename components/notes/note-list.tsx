import Link from "next/link";
import type { ClinicalNoteListItem } from "@/lib/notes/types";

type NoteListProps = {
  notes: ClinicalNoteListItem[];
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

export function NoteList({ notes }: NoteListProps) {
  return (
    <section className="card stack">
      <h2>Session notes</h2>
      <p className="lede">
        {notes.length
          ? `${notes.length} note record${notes.length === 1 ? "" : "s"} linked to this appointment.`
          : "No session notes created yet for this appointment."}
      </p>

      {notes.length ? (
        <div className="patient-list">
          {notes.map((note) => (
            <Link className="patient-row" href={`/notes/${note.id}`} key={note.id}>
              <div>
                <h3>{note.title}</h3>
                <p>{formatDateTime(note.updated_at)}</p>
              </div>
              <div className="patient-row-meta">
                <span className="status-pill">{note.status}</span>
                <span>{note.note_type.replace("_", " ")}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
