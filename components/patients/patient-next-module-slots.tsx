export function PatientNextModuleSlots() {
  return (
    <section className="card stack">
      <h2>Next module slots</h2>
      <ul className="panel-list">
        <li>Treatment plans linked to this patient</li>
        <li>Sessions linked to this patient</li>
        <li>Clinical notes and note versions</li>
        <li>AI screening history</li>
        <li>Documents and audio uploads</li>
      </ul>
    </section>
  );
}
