import React from "react";
import {
  EditorActions,
  EditorHead,
  type AdministrativeState,
  type AdministrativeStateInput,
  type CityInput,
  type Country,
  type CountryInput,
} from "../../shared";

const label = (value: string | null | undefined, fallback: string): string =>
  value?.trim() || fallback;
const numberInput = (
  value: number | null,
  onChange: (value: number | null) => void,
) => (
  <input
    type="number"
    value={value ?? ""}
    onChange={(event) =>
      onChange(event.target.value === "" ? null : Number(event.target.value))
    }
  />
);

export function CountryForm({
  draft,
  selectedId,
  saving,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: CountryInput;
  selectedId: string | null;
  saving: boolean;
  onDraft: (draft: CountryInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit country" : "New country"}
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
        Name PT-BR
        <input
          value={draft.namePTBR ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, namePTBR: event.target.value })
          }
        />
      </label>
      <div className="method-path-grid">
        <label>
          Abbreviation
          <input
            value={draft.abbreviation ?? ""}
            onChange={(event) =>
              onDraft({
                ...draft,
                abbreviation: event.target.value.toUpperCase(),
              })
            }
          />
        </label>
        <label>
          BACEN code
          {numberInput(draft.bacenCode, (value) =>
            onDraft({ ...draft, bacenCode: value }),
          )}
        </label>
      </div>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New country"
        saveLabel={selectedId ? "Save country" : "Create country"}
        onNew={onNew}
        onDelete={onDelete}
        hideNew
      />
    </form>
  );
}

export function StateForm({
  draft,
  selectedId,
  saving,
  countries,
  stateCountryFilter,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: AdministrativeStateInput;
  selectedId: string | null;
  saving: boolean;
  countries: Country[];
  stateCountryFilter: string;
  onDraft: (draft: AdministrativeStateInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit state" : "New state"}
        id={selectedId}
      />
      <label>
        Name
        <input
          value={draft.name ?? ""}
          onChange={(event) => onDraft({ ...draft, name: event.target.value })}
        />
      </label>
      <div className="method-path-grid">
        <label>
          Abbreviation
          <input
            value={draft.abbreviation ?? ""}
            onChange={(event) =>
              onDraft({
                ...draft,
                abbreviation: event.target.value.toUpperCase(),
              })
            }
          />
        </label>
        <label>
          IBGE code
          {numberInput(draft.ibgeCode, (value) =>
            onDraft({ ...draft, ibgeCode: value }),
          )}
        </label>
      </div>
      <label>
        Country
        <select
          value={
            draft.countryId ??
            (stateCountryFilter === "all" ? "" : stateCountryFilter)
          }
          onChange={(event) =>
            onDraft({ ...draft, countryId: event.target.value || null })
          }
        >
          <option value="">No country</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {label(country.namePTBR ?? country.name, country.id)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Call codes
        <input
          value={draft.callCodes ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, callCodes: event.target.value })
          }
        />
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New state"
        saveLabel={selectedId ? "Save state" : "Create state"}
        onNew={onNew}
        onDelete={onDelete}
        hideNew
      />
    </form>
  );
}

export function CityForm({
  draft,
  selectedId,
  saving,
  states,
  cityStateFilter,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  draft: CityInput;
  selectedId: string | null;
  saving: boolean;
  states: AdministrativeState[];
  cityStateFilter: string;
  onDraft: (draft: CityInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit city" : "New city"}
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
        State
        <select
          value={
            draft.stateId ?? (cityStateFilter === "all" ? "" : cityStateFilter)
          }
          onChange={(event) =>
            onDraft({ ...draft, stateId: event.target.value || null })
          }
        >
          <option value="">No state</option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {label(state.name, state.id)}
            </option>
          ))}
        </select>
      </label>
      <label>
        IBGE code
        {numberInput(draft.ibgeCode, (value) =>
          onDraft({ ...draft, ibgeCode: value }),
        )}
      </label>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New city"
        saveLabel={selectedId ? "Save city" : "Create city"}
        onNew={onNew}
        onDelete={onDelete}
        hideNew
      />
    </form>
  );
}
