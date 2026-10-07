import React from "react";
import {
  EditorActions,
  EditorHead,
  cleanText,
  type FiscalPolicySetInput,
} from "../../shared";
import { DateFields } from "./TaxPickers";

export function PolicySetForm({
  draft,
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: FiscalPolicySetInput;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: FiscalPolicySetInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit policy set" : "New policy set"}
        id={selectedId}
      />
      <div className="tax-frame-row tax-frame-row-2">
        <label>
          Code
          <input
            value={draft.code}
            onChange={(event) => onDraft({ ...draft, code: event.target.value })}
            required
          />
        </label>
        <label>
          Version
          <input
            type="number"
            min="1"
            step="1"
            value={draft.version}
            onChange={(event) =>
              onDraft({ ...draft, version: Number(event.target.value) })
            }
            required
          />
        </label>
      </div>
      <label>
        Name
        <input
          value={draft.name}
          onChange={(event) => onDraft({ ...draft, name: event.target.value })}
          required
        />
      </label>
      <label>
        Status
        <select
          value={draft.status}
          onChange={(event) =>
            onDraft({
              ...draft,
              status: event.target.value as FiscalPolicySetInput["status"],
            })
          }
        >
          <option>Draft</option>
          <option>Published</option>
          <option>Retired</option>
        </select>
      </label>
      <label>
        Description
        <textarea
          value={draft.description ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, description: cleanText(event.target.value) })
          }
        />
      </label>
      <DateFields
        dateStart={draft.dateStart}
        dateEnd={draft.dateEnd}
        onChange={(dateStart, dateEnd) =>
          onDraft({ ...draft, dateStart, dateEnd })
        }
      />
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New policy set"
        saveLabel={selectedId ? "Save policy set" : "Create policy set"}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}
