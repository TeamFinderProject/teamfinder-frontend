export default function StubPage({ title, summary, cases }) {
  return (
    <section className="page">
      <h1 className="page__title">{title}</h1>
      <p className="page__lead">{summary}</p>

      {cases?.length > 0 && (
        <div className="cases">
          {cases.map((c) => (
            <span key={c.id} className="case">
              <span className="case__id">{c.id}</span>
              {c.name}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
