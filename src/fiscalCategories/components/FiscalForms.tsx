import React from "react";
import { Search, X } from "lucide-react";
import {
  EditorActions,
  EditorHead,
  type FiscalCategoryInput,
  type FiscalCESTInput,
  type FiscalCFOPInput,
  type FiscalClassTribInput,
  type FiscalIPIFrameInput,
  type FiscalISSQNFrameInput,
} from "../../shared";

type FrameDraft = FiscalIPIFrameInput;
type CfopDraft = FiscalCFOPInput;
type CestDraft = FiscalCESTInput;
type ClassTribDraft = FiscalClassTribInput;
type IssqnDraft = FiscalISSQNFrameInput;

export function CategoryForm({
  title,
  draft,
  selectedId,
  saving,
  parentLabel,
  onOpenParentPicker,
  onClearParent,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  title: string;
  draft: FiscalCategoryInput;
  selectedId: string | null;
  saving: boolean;
  parentLabel: string;
  onOpenParentPicker: () => void;
  onClearParent: () => void;
  onDraft: (draft: FiscalCategoryInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit " + title : "New " + title}
        id={selectedId}
      />
      <label>
        Code
        <input
          value={draft.code}
          onChange={(event) => onDraft({ ...draft, code: event.target.value })}
          required
        />
      </label>
      <label>
        Description
        <textarea
          value={draft.description}
          onChange={(event) =>
            onDraft({ ...draft, description: event.target.value })
          }
          required
        />
      </label>
      <fieldset className="parent-field">
        <legend>Parent</legend>
        <div className="parent-summary">
          <span>{parentLabel}</span>
          <div>
            <button
              className="secondary-button"
              type="button"
              onClick={onOpenParentPicker}
            >
              <Search size={16} />
              Choose
            </button>
            {draft.parent && (
              <button
                className="secondary-button"
                type="button"
                onClick={onClearParent}
              >
                <X size={16} />
                Root
              </button>
            )}
          </div>
        </div>
      </fieldset>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel={"New " + title}
        saveLabel={selectedId ? "Save " + title : "Create " + title}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}
export function CFOPForm({
  draft,
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: CfopDraft;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: CfopDraft) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit CFOP" : "New CFOP"}
        id={selectedId}
      />
      <label>
        Code
        <input
          value={draft.code}
          onChange={(event) => onDraft({ ...draft, code: event.target.value })}
          required
        />
      </label>
      <label>
        Description
        <textarea
          value={draft.description}
          onChange={(event) =>
            onDraft({ ...draft, description: event.target.value })
          }
          required
        />
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New CFOP"
        saveLabel={selectedId ? "Save CFOP" : "Create CFOP"}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}

export function CESTForm({
  draft,
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: CestDraft;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: CestDraft) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit CEST" : "New CEST"}
        id={selectedId}
      />
      <label>
        Code
        <input
          value={draft.code}
          onChange={(event) => onDraft({ ...draft, code: event.target.value })}
          required
        />
      </label>
      <label>
        Item
        <input
          value={draft.item ?? ""}
          onChange={(event) => onDraft({ ...draft, item: event.target.value })}
        />
      </label>
      <label>
        NCM
        <input
          value={draft.ncm ?? ""}
          onChange={(event) => onDraft({ ...draft, ncm: event.target.value })}
        />
      </label>
      <label>
        Segment
        <input
          value={draft.segment ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, segment: event.target.value })
          }
        />
      </label>
      <label>
        Description
        <textarea
          value={draft.description}
          onChange={(event) =>
            onDraft({ ...draft, description: event.target.value })
          }
          required
        />
      </label>
      <label>
        Source
        <input
          value={draft.source}
          onChange={(event) =>
            onDraft({ ...draft, source: event.target.value })
          }
          required
        />
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New CEST"
        saveLabel={selectedId ? "Save CEST" : "Create CEST"}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}
export function ClassTribForm({
  draft,
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: ClassTribDraft;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: ClassTribDraft) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit ClassTrib" : "New ClassTrib"}
        id={selectedId}
      />
      <label>
        Code
        <input
          value={draft.code}
          onChange={(event) => onDraft({ ...draft, code: event.target.value })}
          required
        />
      </label>
      <label>
        CST code
        <input
          value={draft.cstCode}
          onChange={(event) =>
            onDraft({ ...draft, cstCode: event.target.value })
          }
          required
        />
      </label>
      <label>
        Name
        <input
          value={draft.name}
          onChange={(event) => onDraft({ ...draft, name: event.target.value })}
          required
        />
      </label>
      <label>
        CST description
        <textarea
          value={draft.cstDescription}
          onChange={(event) =>
            onDraft({ ...draft, cstDescription: event.target.value })
          }
          required
        />
      </label>
      <label>
        Description
        <textarea
          value={draft.description}
          onChange={(event) =>
            onDraft({ ...draft, description: event.target.value })
          }
          required
        />
      </label>
      <label>
        Rate type
        <input
          value={draft.rateType ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, rateType: event.target.value })
          }
        />
      </label>
      <label>
        IBS reduction
        <input
          type="number"
          step="0.0001"
          value={draft.pRedIBS ?? ""}
          onChange={(event) =>
            onDraft({
              ...draft,
              pRedIBS:
                event.target.value === "" ? null : Number(event.target.value),
            })
          }
        />
      </label>
      <label>
        CBS reduction
        <input
          type="number"
          step="0.0001"
          value={draft.pRedCBS ?? ""}
          onChange={(event) =>
            onDraft({
              ...draft,
              pRedCBS:
                event.target.value === "" ? null : Number(event.target.value),
            })
          }
        />
      </label>
      <label>
        Start date
        <input
          type="date"
          value={draft.dateStart ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, dateStart: event.target.value })
          }
        />
      </label>
      <label>
        End date
        <input
          type="date"
          value={draft.dateEnd ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, dateEnd: event.target.value })
          }
        />
      </label>
      <label>
        Updated at source
        <input
          type="date"
          value={draft.sourceUpdatedAt ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, sourceUpdatedAt: event.target.value })
          }
        />
      </label>
      <label>
        LC 214
        <input
          value={draft.lc214 ?? ""}
          onChange={(event) => onDraft({ ...draft, lc214: event.target.value })}
        />
      </label>
      <label>
        Annex
        <input
          value={draft.annex ?? ""}
          onChange={(event) => onDraft({ ...draft, annex: event.target.value })}
        />
      </label>
      <label>
        Link
        <input
          value={draft.link ?? ""}
          onChange={(event) => onDraft({ ...draft, link: event.target.value })}
        />
      </label>
      <label>
        Legal text
        <textarea
          value={draft.legalText ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, legalText: event.target.value })
          }
        />
      </label>
      <label>
        CBS regulation
        <textarea
          value={draft.regulationCBS ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, regulationCBS: event.target.value })
          }
        />
      </label>
      <label>
        IBS regulation
        <textarea
          value={draft.regulationIBS ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, regulationIBS: event.target.value })
          }
        />
      </label>
      <label>
        Source
        <input
          value={draft.source}
          onChange={(event) =>
            onDraft({ ...draft, source: event.target.value })
          }
          required
        />
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New ClassTrib"
        saveLabel={selectedId ? "Save ClassTrib" : "Create ClassTrib"}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}
export function IPIForm({
  draft,
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: FrameDraft;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: FrameDraft) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit IPI frame" : "New IPI frame"}
        id={selectedId}
      />
      <label>
        Code
        <input
          value={draft.code}
          onChange={(event) => onDraft({ ...draft, code: event.target.value })}
          required
        />
      </label>
      <label>
        Group
        <input
          value={draft.group}
          onChange={(event) => onDraft({ ...draft, group: event.target.value })}
          required
        />
      </label>
      <label>
        Description
        <textarea
          value={draft.description}
          onChange={(event) =>
            onDraft({ ...draft, description: event.target.value })
          }
          required
        />
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New IPI frame"
        saveLabel={selectedId ? "Save IPI frame" : "Create IPI frame"}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}
export function ISSQNForm({
  draft,
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: IssqnDraft;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: IssqnDraft) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit ISSQN frame" : "New ISSQN frame"}
        id={selectedId}
      />
      <label>
        Code
        <input
          value={draft.code}
          onChange={(event) => onDraft({ ...draft, code: event.target.value })}
          required
        />
      </label>
      <label>
        Description
        <textarea
          value={draft.description ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, description: event.target.value })
          }
        />
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New ISSQN frame"
        saveLabel={selectedId ? "Save ISSQN frame" : "Create ISSQN frame"}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}
