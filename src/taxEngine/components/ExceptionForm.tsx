import React from "react";
import {
  EditorActions,
  EditorHead,
  type FiscalExceptionInput,
  type FiscalFrameTax,
} from "../../shared";
import { DateFields } from "./TaxPickers";

const toNumber = (
  value: string | number | null | undefined,
  fallback = 0,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const frameTaxLabel = (tax: FiscalFrameTax): string =>
  "#" + tax.numericId + " " + tax.taxCode;

export function ExceptionForm({
  draft,
  selectedId,
  saving,
  frameTaxes,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: FiscalExceptionInput;
  selectedId: string | null;
  saving: boolean;
  frameTaxes: FiscalFrameTax[];
  onDraft: (draft: FiscalExceptionInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit fiscal exception" : "New fiscal exception"}
        id={selectedId}
      />
      <label>
        Frame tax
        <select
          value={draft.frameTaxId}
          onChange={(event) =>
            onDraft({ ...draft, frameTaxId: event.target.value })
          }
          required
        >
          <option value="">Select frame tax</option>
          {frameTaxes.map((tax) => (
            <option key={tax.id} value={tax.id}>
              {frameTaxLabel(tax)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Override field
        <input
          value={draft.overrideField}
          onChange={(event) =>
            onDraft({ ...draft, overrideField: event.target.value })
          }
          required
        />
      </label>
      <label>
        Override value
        <input
          type="number"
          value={draft.overrideValue ?? ""}
          onChange={(event) =>
            onDraft({
              ...draft,
              overrideValue:
                event.target.value === "" ? null : toNumber(event.target.value),
            })
          }
        />
      </label>
      <label>
        Priority
        <input
          type="number"
          value={draft.priority}
          onChange={(event) =>
            onDraft({ ...draft, priority: toNumber(event.target.value) })
          }
        />
      </label>
      <label>
        Legal basis
        <textarea
          value={draft.overrideLegalBasis}
          onChange={(event) =>
            onDraft({ ...draft, overrideLegalBasis: event.target.value })
          }
          required
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
        newLabel="New exception"
        saveLabel={selectedId ? "Save exception" : "Create exception"}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}
