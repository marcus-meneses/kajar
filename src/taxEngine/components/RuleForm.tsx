import React from "react";
import {
  EditorActions,
  EditorHead,
  cleanText,
  type TaxRuleInput,
} from "../../shared";
import { DateFields } from "./TaxPickers";

export function RuleForm({
  draft,
  parametersText,
  selectedId,
  saving,
  onDraft,
  onParametersText,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: TaxRuleInput;
  parametersText: string;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: TaxRuleInput) => void;
  onParametersText: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit tax rule" : "New tax rule"}
        id={selectedId}
      />
      <label>
        Name
        <input
          value={draft.name}
          onChange={(event) => onDraft({ ...draft, name: event.target.value })}
          required
        />
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
      <label>
        Calculation method
        <select
          value={draft.taxCalcMethod}
          onChange={(event) =>
            onDraft({
              ...draft,
              taxCalcMethod: event.target
                .value as TaxRuleInput["taxCalcMethod"],
            })
          }
        >
          <option>Percentage</option>
          <option>Fixed</option>
          <option>Formula</option>
        </select>
      </label>
      <label>
        Parameters JSON
        <textarea
          value={parametersText}
          onChange={(event) => onParametersText(event.target.value)}
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
        newLabel="New rule"
        saveLabel={selectedId ? "Save rule" : "Create rule"}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}
