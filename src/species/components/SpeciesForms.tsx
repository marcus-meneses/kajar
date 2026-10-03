import React from "react";
import {
  EditorActions,
  EditorHead,
  type BreedInput,
  type Species,
  type SpeciesInput,
} from "../../shared";

const label = (value: string | null | undefined, fallback: string): string =>
  value?.trim() || fallback;

export function SpeciesForm({
  draft,
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: SpeciesInput;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: SpeciesInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit species" : "New species"}
        id={selectedId}
      />
      <label>
        Common name
        <input
          value={draft.commonName ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, commonName: event.target.value })
          }
        />
      </label>
      <label>
        Alternate names
        <input
          value={draft.alternateNames ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, alternateNames: event.target.value })
          }
        />
      </label>
      <label>
        Scientific name
        <input
          value={draft.scientificName ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, scientificName: event.target.value })
          }
        />
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New species"
        saveLabel={selectedId ? "Save species" : "Create species"}
        onNew={onNew}
        onDelete={onDelete}
        hideNew
      />
    </form>
  );
}

export function BreedForm({
  draft,
  selectedId,
  saving,
  species,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: BreedInput;
  selectedId: string | null;
  saving: boolean;
  species: Species[];
  onDraft: (draft: BreedInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit breed" : "New breed"}
        id={selectedId}
      />
      <label>
        Common name
        <input
          value={draft.commonName ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, commonName: event.target.value })
          }
        />
      </label>
      <label>
        Alternate names
        <input
          value={draft.alternateNames ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, alternateNames: event.target.value })
          }
        />
      </label>
      <label>
        Species
        <select
          value={draft.speciesId}
          onChange={(event) =>
            onDraft({ ...draft, speciesId: event.target.value })
          }
          required
        >
          <option value="">No species</option>
          {species.map((item) => (
            <option key={item.id} value={item.id}>
              {label(item.commonName, item.id)}
            </option>
          ))}
        </select>
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New breed"
        saveLabel={selectedId ? "Save breed" : "Create breed"}
        onNew={onNew}
        onDelete={onDelete}
        hideNew
      />
    </form>
  );
}
