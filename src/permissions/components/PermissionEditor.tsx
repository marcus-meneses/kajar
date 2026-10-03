import React from "react";
import { Plus, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import {
  employeeTypes,
  type EmployeeType,
  type RoutePermissionAudience,
  type RoutePermissionMethod,
} from "../../shared";
import type { EditorMode, PermissionFormInput } from "./types";

const methods: RoutePermissionMethod[] = [
  "GET",
  "POST",
  "PATCH",
  "PUT",
  "DELETE",
];
const sortedEmployeeTypes = [...employeeTypes].sort((left, right) =>
  left.localeCompare(right),
);
const routeKey = (route: PermissionFormInput): string =>
  route.audience + " · " + route.method + " " + route.path;

export function PermissionEditor({
  mode,
  selectedId,
  draft,
  onDraftChange,
  onSubmit,
  onDelete,
  onCreate,
  saving,
}: {
  mode: EditorMode;
  selectedId: string | null;
  draft: PermissionFormInput;
  onDraftChange: (draft: PermissionFormInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onCreate: () => void;
  saving: boolean;
}) {
  if (mode === "empty") {
    return (
      <aside className="editor empty-state">
        <SlidersHorizontal size={22} />
        <p>Select a route to edit, or create a new route permission.</p>
        <button className="primary-button" type="button" onClick={onCreate}>
          <Plus size={16} />
          New rule
        </button>
      </aside>
    );
  }

  const update = <K extends keyof PermissionFormInput>(
    key: K,
    value: PermissionFormInput[K],
  ) => onDraftChange({ ...draft, [key]: value });
  const toggleType = (type: EmployeeType) => {
    const next = draft.allowedEmployeeTypes.includes(type)
      ? draft.allowedEmployeeTypes.filter((item) => item !== type)
      : [...draft.allowedEmployeeTypes, type];
    update("allowedEmployeeTypes", next);
  };

  return (
    <aside className="editor">
      <form className="form-grid" onSubmit={onSubmit}>
        <header className="editor-head">
          <h2>
            {mode === "create" ? "New route permission" : routeKey(draft)}
          </h2>
          <span>{mode === "create" ? "Unsaved rule" : selectedId}</span>
        </header>
        <div className="method-path-grid">
          <label>
            Audience
            <select value={draft.audience} onChange={(event) => update("audience", event.target.value as RoutePermissionAudience)}>
              <option value="ZEAL">ZEAL</option><option value="KAHU">KAHU</option>
            </select>
          </label>
          <label>
            Method
            <select
              value={draft.method}
              onChange={(event) =>
                update("method", event.target.value as RoutePermissionMethod)
              }
            >
              {methods.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </label>
          <label>
            Path
            <input
              value={draft.path}
              onChange={(event) => update("path", event.target.value)}
              required
              placeholder="/api/resource/:id"
            />
          </label>
        </div>
        <label>
          Description
          <textarea
            value={draft.permission}
            onChange={(event) => update("permission", event.target.value)}
            required
          />
        </label>
        <label>
          Operation
          <input
            value={draft.operation}
            onChange={(event) => update("operation", event.target.value)}
            pattern="[a-z][A-Za-z0-9]*\.[a-z][A-Za-z0-9]*"
            placeholder="module.action"
            title="Use module.action, for example animals.create"
            required
          />
        </label>
        <label>
          Section
          <input
            value={draft.section}
            onChange={(event) => update("section", event.target.value)}
            required
          />
        </label>
        <label className="switch">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) => update("active", event.target.checked)}
          />{" "}
          Active
        </label>
        <fieldset>
          <legend>Allowed employee types</legend>
          <div className="check-grid">
            {sortedEmployeeTypes.map((type) => (
              <label className="check" key={type}>
                <input
                  type="checkbox"
                  checked={draft.allowedEmployeeTypes.includes(type)}
                  onChange={() => toggleType(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="editor-actions">
          {mode === "edit" && (
            <button
              className="danger-button"
              type="button"
              onClick={onDelete}
              disabled={saving}
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
          <button
            className="primary-button save-button"
            type="submit"
            disabled={saving}
          >
            <Save size={16} />
            {mode === "create" ? "Create rule" : "Save changes"}
          </button>
        </div>
      </form>
    </aside>
  );
}
