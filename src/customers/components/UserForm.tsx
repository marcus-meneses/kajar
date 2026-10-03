import React from "react";
import {
  EditorActions,
  EditorHead,
  type Employee,
  type UserInput,
} from "../../shared";

const userStatuses = ["active", "inactive", "suspended"] as const;

export function UserForm({
  draft,
  employee,
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: UserInput;
  employee: Employee | null;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: UserInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit user" : "New user"}
        id={selectedId}
      />
      <fieldset className="parent-field">
        <legend>Employee</legend>
        <div className="parent-summary">
          <span>
            {employee
              ? employee.fullName + " / " + employee.type
              : "No employee selected"}
          </span>
        </div>
      </fieldset>
      <label>
        Name
        <input
          value={draft.name ?? ""}
          onChange={(event) => onDraft({ ...draft, name: event.target.value })}
        />
      </label>
      <div className="method-path-grid">
        <label>
          Login
          <input
            value={draft.login ?? ""}
            onChange={(event) =>
              onDraft({ ...draft, login: event.target.value })
            }
          />
        </label>
        <label>
          Status
          <select
            value={draft.status}
            onChange={(event) =>
              onDraft({
                ...draft,
                status: event.target.value as UserInput["status"],
              })
            }
          >
            {userStatuses.map((item) => (
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
      <label>
        Password SHA-256
        <input
          value={draft.passwordSHA256 ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, passwordSHA256: event.target.value })
          }
        />
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New user"
        saveLabel={selectedId ? "Save user" : "Create user"}
        onNew={onNew}
        onDelete={onDelete}
        hideNew
      />
    </form>
  );
}
