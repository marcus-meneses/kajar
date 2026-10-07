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
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: TaxRuleInput;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: TaxRuleInput) => void;
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
          onChange={(event) => {
            const method = event.target.value as TaxRuleInput["taxCalcMethod"];
            const taxCalcParameters = method === "Percentage" ? { rate: 0 }
              : method === "FixedPerItem" ? { amount: 0 }
              : method === "ReducedBase" ? { rate: 0, reductionPercent: 0 } : {};
            onDraft({ ...draft, taxCalcMethod: method, taxCalcParameters });
          }}
        >
          <option>Percentage</option>
          <option>FixedPerItem</option>
          <option>ReducedBase</option>
          <option>Exempt</option>
          <option>NotApplicable</option>
        </select>
      </label>
      {(draft.taxCalcMethod === "Percentage" || draft.taxCalcMethod === "ReducedBase") && <label>
        Rate (%)
        <input type="number" min="0" max="100" step="0.000001" value={Number(draft.taxCalcParameters.rate ?? 0)} onChange={(event) => onDraft({ ...draft, taxCalcParameters: { ...draft.taxCalcParameters, rate: Number(event.target.value) } })} required />
      </label>}
      {draft.taxCalcMethod === "FixedPerItem" && <label>
        Amount per item
        <input type="number" min="0" step="0.0001" value={Number(draft.taxCalcParameters.amount ?? 0)} onChange={(event) => onDraft({ ...draft, taxCalcParameters: { amount: Number(event.target.value) } })} required />
      </label>}
      {draft.taxCalcMethod === "ReducedBase" && <label>
        Base reduction (%)
        <input type="number" min="0" max="100" step="0.000001" value={Number(draft.taxCalcParameters.reductionPercent ?? 0)} onChange={(event) => onDraft({ ...draft, taxCalcParameters: { ...draft.taxCalcParameters, reductionPercent: Number(event.target.value) } })} required />
      </label>}
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
