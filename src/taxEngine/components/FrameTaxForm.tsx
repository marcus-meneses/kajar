import React from "react";
import {
  EditorActions,
  EditorHead,
  cleanText,
  type FiscalFrame,
  type FiscalFrameTax,
  type FiscalFrameTaxInput,
  type TaxRule,
} from "../../shared";

const toNumber = (
  value: string | number | null | undefined,
  fallback = 0,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const ruleLabel = (rule: TaxRule): string =>
  "#" + rule.numericId + " " + rule.name;
const frameLabel = (frame: FiscalFrame): string =>
  [
    "#" + frame.numericId,
    frame.version,
    frame.countryId,
    frame.stateId,
    frame.itemType,
    frame.taxRegime,
  ]
    .filter(Boolean)
    .join(" / ");
const frameTaxLabel = (tax: FiscalFrameTax): string =>
  "#" + tax.numericId + " " + tax.taxCode;

export function FrameTaxForm({
  draft,
  selectedId,
  saving,
  frames,
  rules,
  frameTaxes,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: FiscalFrameTaxInput;
  selectedId: string | null;
  saving: boolean;
  frames: FiscalFrame[];
  rules: TaxRule[];
  frameTaxes: FiscalFrameTax[];
  onDraft: (draft: FiscalFrameTaxInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit frame tax" : "New frame tax"}
        id={selectedId}
      />
      <label>
        Fiscal frame
        <select
          value={draft.frameId}
          onChange={(event) =>
            onDraft({ ...draft, frameId: event.target.value })
          }
          required
        >
          <option value="">Select frame</option>
          {frames.map((frame) => (
            <option key={frame.id} value={frame.id}>
              {frameLabel(frame)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tax rule
        <select
          value={draft.taxRuleId}
          onChange={(event) =>
            onDraft({ ...draft, taxRuleId: event.target.value })
          }
          required
        >
          <option value="">Select rule</option>
          {rules.map((rule) => (
            <option key={rule.id} value={rule.id}>
              {ruleLabel(rule)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tax code
        <input
          value={draft.taxCode}
          onChange={(event) =>
            onDraft({ ...draft, taxCode: event.target.value })
          }
          required
        />
      </label>
      <div className="method-path-grid">
        <label>
          Base source
          <select
            value={draft.baseSource}
            onChange={(event) =>
              onDraft({
                ...draft,
                baseSource: event.target
                  .value as FiscalFrameTaxInput["baseSource"],
              })
            }
          >
            <option>ItemNet</option>
            <option>ItemGross</option>
            <option>AfterBaseFrameTax</option>
          </select>
        </label>
        <label>
          Phase
          <select
            value={draft.phase ?? ""}
            onChange={(event) =>
              onDraft({
                ...draft,
                phase: cleanText(
                  event.target.value,
                ) as FiscalFrameTaxInput["phase"],
              })
            }
          >
            <option value="">No phase</option>
            <option>Normal</option>
            <option>Test</option>
            <option>Transition</option>
            <option>Final</option>
          </select>
        </label>
      </div>
      <label>
        Depends on tax
        <select
          value={draft.dependsOnTaxId ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, dependsOnTaxId: cleanText(event.target.value) })
          }
        >
          <option value="">No dependency</option>
          {frameTaxes
            .filter((tax) => tax.id !== selectedId)
            .map((tax) => (
              <option key={tax.id} value={tax.id}>
                {frameTaxLabel(tax)}
              </option>
            ))}
        </select>
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
      <label className="switch">
        <input
          type="checkbox"
          checked={draft.affectsInvoice}
          onChange={(event) =>
            onDraft({ ...draft, affectsInvoice: event.target.checked })
          }
        />{" "}
        Affects invoice
      </label>
      <label className="switch">
        <input
          type="checkbox"
          checked={draft.affectsPayment}
          onChange={(event) =>
            onDraft({ ...draft, affectsPayment: event.target.checked })
          }
        />{" "}
        Affects payment
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New frame tax"
        saveLabel={selectedId ? "Save frame tax" : "Create frame tax"}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}
