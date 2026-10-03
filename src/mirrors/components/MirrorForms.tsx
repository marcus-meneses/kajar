import React from "react";
import {
  EditorActions,
  EditorHead,
  type ProductCategoryMirror,
  type ProductCategoryMirrorInput,
  type ServiceCategoryMirror,
  type ServiceCategoryMirrorInput,
  type WorkScheduleTemplateMirrorInput,
} from "../../shared";

const referenceOptions = [
  { value: "VET", label: "Veterinary services (VET)" },
  { value: "GRM", label: "Grooming services (GRM)" },
  { value: "SHP", label: "Pet-shop products/services (SHP)" },
  { value: "HTL", label: "Hotel (HTL)" },
] as const;

const label = (value: string | null | undefined, fallback: string): string =>
  value?.trim() || fallback;

export function ProductMirrorForm({
  draft,
  selectedId,
  saving,
  products,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: ProductCategoryMirrorInput;
  selectedId: string | null;
  saving: boolean;
  products: ProductCategoryMirror[];
  onDraft: (draft: ProductCategoryMirrorInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={
          selectedId
            ? "Edit product category mirror"
            : "New product category mirror"
        }
        id={selectedId}
      />
      <label>
        Name
        <input
          value={draft.name ?? ""}
          onChange={(event) => onDraft({ ...draft, name: event.target.value })}
        />
      </label>
      <label>
        Parent
        <select
          value={draft.parentId ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, parentId: event.target.value || null })
          }
        >
          <option value="">Root category</option>
          {products
            .filter((item) => item.id !== selectedId)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {label(item.name, item.id)}
              </option>
            ))}
        </select>
      </label>
      <label>
        Reference
        <select value={draft.reference ?? ""} onChange={(event) => onDraft({ ...draft, reference: event.target.value || null })}>
          <option value="">No reference</option>
          {referenceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="switch">
        <input
          type="checkbox"
          checked={draft.recursive}
          onChange={(event) =>
            onDraft({ ...draft, recursive: event.target.checked })
          }
        />{" "}
        Recursive
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New product mirror"
        saveLabel={selectedId ? "Save product mirror" : "Create product mirror"}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}

export function ServiceMirrorForm({
  draft,
  selectedId,
  saving,
  services,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: ServiceCategoryMirrorInput;
  selectedId: string | null;
  saving: boolean;
  services: ServiceCategoryMirror[];
  onDraft: (draft: ServiceCategoryMirrorInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={
          selectedId
            ? "Edit service category mirror"
            : "New service category mirror"
        }
        id={selectedId}
      />
      <label>
        Name
        <input
          value={draft.name ?? ""}
          onChange={(event) => onDraft({ ...draft, name: event.target.value })}
        />
      </label>
      <label>
        Parent
        <select
          value={draft.parentId ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, parentId: event.target.value || null })
          }
        >
          <option value="">Root category</option>
          {services
            .filter((item) => item.id !== selectedId)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {label(item.name, item.id)}
              </option>
            ))}
        </select>
      </label>
      <label>
        Reference
        <select value={draft.reference ?? ""} onChange={(event) => onDraft({ ...draft, reference: event.target.value || null })}>
          <option value="">No reference</option>
          {referenceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="switch">
        <input type="checkbox" checked={draft.recursive} onChange={(event) => onDraft({ ...draft, recursive: event.target.checked })} />{" "}
        Recursive
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New service mirror"
        saveLabel={selectedId ? "Save service mirror" : "Create service mirror"}
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}

export function ScheduleMirrorForm({
  draft,
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: WorkScheduleTemplateMirrorInput;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: WorkScheduleTemplateMirrorInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={
          selectedId ? "Edit work schedule mirror" : "New work schedule mirror"
        }
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
            onDraft({ ...draft, description: event.target.value })
          }
        />
      </label>
      <label>
        Timezone
        <input
          value={draft.timezone}
          onChange={(event) =>
            onDraft({ ...draft, timezone: event.target.value })
          }
          required
        />
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New schedule mirror"
        saveLabel={
          selectedId ? "Save schedule mirror" : "Create schedule mirror"
        }
        onNew={onNew}
        onDelete={onDelete}
      />
    </form>
  );
}
