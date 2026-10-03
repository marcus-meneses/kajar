import React from "react";
import {
  EditorActions,
  EditorHead,
  employeeTypes,
  type EmployeeInput,
  type EmployeeType,
} from "../../shared";

const employeeStatuses = [
  "active",
  "inactive",
  "suspended",
  "terminated",
] as const;
const sortedEmployeeTypes = [...employeeTypes].sort((left, right) =>
  left.localeCompare(right),
);

export function EmployeeForm({
  draft,
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: EmployeeInput;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: EmployeeInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit employee" : "New employee"}
        id={selectedId}
      />
      <label>
        Full name
        <input
          value={draft.fullName}
          onChange={(event) =>
            onDraft({ ...draft, fullName: event.target.value })
          }
          required
        />
      </label>
      <label>
        Display name
        <input
          value={draft.displayName}
          onChange={(event) =>
            onDraft({ ...draft, displayName: event.target.value })
          }
          required
        />
      </label>
      <div className="method-path-grid">
        <label>
          Type
          <select
            value={draft.type}
            onChange={(event) =>
              onDraft({ ...draft, type: event.target.value as EmployeeType })
            }
          >
            {sortedEmployeeTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={draft.status}
            onChange={(event) =>
              onDraft({
                ...draft,
                status: event.target.value as EmployeeInput["status"],
              })
            }
          >
            {employeeStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Email
        <input
          type="email"
          value={draft.email ?? ""}
          onChange={(event) => onDraft({ ...draft, email: event.target.value })}
        />
      </label>
      <label>
        Phone
        <input
          value={draft.phone ?? ""}
          onChange={(event) => onDraft({ ...draft, phone: event.target.value })}
        />
      </label>
      <label>
        CPF
        <input
          value={draft.cpf ?? ""}
          onChange={(event) => onDraft({ ...draft, cpf: event.target.value })}
        />
      </label>
      <div className="employee-date-grid">
        <label>
          Hired at
          <input
            type="date"
            value={draft.hiredAt ?? ""}
            onChange={(event) =>
              onDraft({ ...draft, hiredAt: event.target.value })
            }
          />
        </label>
        <label>
          Terminated at
          <input
            type="date"
            value={draft.terminatedAt ?? ""}
            onChange={(event) =>
              onDraft({ ...draft, terminatedAt: event.target.value })
            }
          />
        </label>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.canLogin}
          onChange={(event) =>
            onDraft({ ...draft, canLogin: event.target.checked })
          }
        />
        Can login
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.commissionEnabled}
          onChange={(event) =>
            onDraft({ ...draft, commissionEnabled: event.target.checked })
          }
        />
        Commission enabled
      </label>
      <label>
        Notes
        <textarea
          value={draft.notes ?? ""}
          onChange={(event) => onDraft({ ...draft, notes: event.target.value })}
        />
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New employee"
        saveLabel={selectedId ? "Save employee" : "Create employee"}
        onNew={onNew}
        onDelete={onDelete}
        hideNew
      />
    </form>
  );
}
