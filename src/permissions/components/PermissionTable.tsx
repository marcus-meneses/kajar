import { Search } from "lucide-react";
import type { EmployeeType, RoutePermission } from "../../shared";

export function PermissionTable({
  rows,
  selectedId,
  search,
  onSearchChange,
  onSelect,
}: {
  rows: RoutePermission[];
  selectedId: string | null;
  search: string;
  onSearchChange: (search: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="route-list">
      <div className="route-list-controls">
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search route path, operation, section"
          />
        </label>
      </div>
      {rows.length ? (
        <div className="table-panel">
          <table>
            <thead>
              <tr>
                <th>Audience</th>
                <th>Method</th>
                <th>Path</th>
                <th>Allowed</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.id === selectedId ? "selected" : ""}
                  onClick={() => onSelect(row.id)}
                >
                  <td><span className="badge">{row.audience}</span></td>
                  <td>
                    <span className="method">{row.method}</span>
                  </td>
                  <td>
                    <div className="route-path">{row.path}</div>
                    <div className="route-description">{row.permission}</div>
                  </td>
                  <td>
                    <EmployeeTypeBadges values={row.allowedEmployeeTypes} />
                  </td>
                  <td>{row.section}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-panel empty-state">
          No permission routes match the current filters.
        </div>
      )}
    </section>
  );
}

function EmployeeTypeBadges({ values }: { values: EmployeeType[] }) {
  if (!values.length) return <span className="badge empty">none</span>;
  return (
    <div className="badge-row">
      {values.map((value) => (
        <span className="badge" key={value}>
          {value}
        </span>
      ))}
    </div>
  );
}
