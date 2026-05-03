type PatientSearchProps = {
  initialQuery: string;
};

export function PatientSearch({ initialQuery }: PatientSearchProps) {
  return (
    <form className="search-bar" action="/patients" method="get">
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
