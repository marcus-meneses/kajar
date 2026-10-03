export function MetricGroup({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, number]>;
}) {
  return (
    <section className="dashboard-panel">
      <h3>{title}</h3>
      <div className="dashboard-row-list">
        {rows.map(([label, value]) => (
          <div key={label} className="dashboard-row">
            <span>{label}</span>
            <strong>{value.toLocaleString()}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
