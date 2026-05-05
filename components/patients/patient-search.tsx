type PatientSearchProps = {
  initialQuery: string;
  status: "active" | "archived";
  sort: "surname" | "last_seen";
};

export function PatientSearch({ initialQuery, status, sort }: PatientSearchProps) {
  return (
    <form className="search-bar" action="/patients" method="get">
      <input name="status" type="hidden" value={status} />
      <input name="sort" type="hidden" value={sort} />
      <input
        aria-label="Search patients"
        defaultValue={initialQuery}
        name="search"
        placeholder="Search by name, email, or phone"
        type="search"
      />
      <button className="button button-secondary" type="submit">
        Search
      </button>
    </form>
  );
}
