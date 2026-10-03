import { employeeTypes } from "../../shared";
import type { FilterState } from "./types";

const sortedEmployeeTypes = [...employeeTypes].sort((left, right) =>
  left.localeCompare(right),
);

export function PermissionFilters({
  filters,
  sections,
  methods,
  onChange,
}: {
  filters: FilterState;
  sections: string[];
  methods: string[];
  onChange: (filters: FilterState) => void;
}) {
  return (
    <section
      className="toolbar route-filterbar"
      aria-label="Permission filters"
    >
      <label>
        Audience
        <select value={filters.audience} onChange={(event) => onChange({ ...filters, audience: event.target.value })}>
          <option value="all">All audiences</option>
          <option value="ZEAL">ZEAL</option>
          <option value="KAHU">KAHU</option>
        </select>
      </label>
      <label>
        Section
        <select
          value={filters.section}
          onChange={(event) =>
            onChange({ ...filters, section: event.target.value })
          }
        >
          <option value="all">All sections</option>
          {sections.map((section) => (
            <option key={section}>{section}</option>
          ))}
        </select>
      </label>
      <label>
        Method
        <select
          value={filters.method}
          onChange={(event) =>
            onChange({ ...filters, method: event.target.value })
          }
        >
          <option value="all">All methods</option>
          {methods.map((method) => (
            <option key={method}>{method}</option>
          ))}
        </select>
      </label>
      <label>
        Type
        <select
          value={filters.employeeType}
          onChange={(event) =>
            onChange({ ...filters, employeeType: event.target.value })
          }
        >
          <option value="all">All types</option>
          {sortedEmployeeTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </label>
    </section>
  );
}
