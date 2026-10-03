import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Metric,
  Status,
  EmptyState,
  cleanText,
  fetchAllPages,
  label,
} from "../shared";
import {
  BreedForm,
  BreedListWorkspace,
  SpeciesForm,
  SpeciesListPane,
} from "./components";
import type { ApiClient } from "../shared";
import type { Breed, BreedInput, Species, SpeciesInput } from "../shared";

type SpeciesTab = "species" | "breeds";
type StatusState = { kind: "idle" | "ok" | "error" | "loading"; text: string };
type RequestErrorHandler = (
  title: string,
  error: unknown,
  fallback: string,
) => void;

const blankSpecies = (): SpeciesInput => ({
  commonName: "",
  alternateNames: "",
  scientificName: "",
});
const blankBreed = (): BreedInput => ({
  commonName: "",
  alternateNames: "",
  speciesId: "",
});
const toSpeciesInput = (species: Species): SpeciesInput => ({
  commonName: species.commonName,
  alternateNames: species.alternateNames,
  scientificName: species.scientificName,
});
const toBreedInput = (breed: Breed): BreedInput => ({
  commonName: breed.commonName,
  alternateNames: breed.alternateNames,
  speciesId: breed.speciesId,
});

export function SpeciesEditor({
  api,
  onRequestError,
}: {
  api: ApiClient;
  onRequestError: RequestErrorHandler;
}) {
  const [tab, setTab] = useState<SpeciesTab>("species");
  const [species, setSpecies] = useState<Species[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [speciesCount, setSpeciesCount] = useState(0);
  const [breedCount, setBreedCount] = useState(0);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(
    null,
  );
  const [selectedBreedId, setSelectedBreedId] = useState<string | null>(null);
  const [breedEditorOpen, setBreedEditorOpen] = useState(false);
  const [speciesDraft, setSpeciesDraft] = useState<SpeciesInput>(blankSpecies);
  const [breedDraft, setBreedDraft] = useState<BreedInput>(blankBreed);
  const [speciesSearch, setSpeciesSearch] = useState("");
  const [breedSearch, setBreedSearch] = useState("");
  const [breedSpeciesFilter, setBreedSpeciesFilter] = useState("all");
  const [status, setStatus] = useState<StatusState>({ kind: "idle", text: "" });
  const [saving, setSaving] = useState(false);

  const speciesById = useMemo(
    () => new Map(species.map((item) => [item.id, item])),
    [species],
  );
  const filteredSpecies = useMemo(() => {
    const search = speciesSearch.trim().toLowerCase();
    if (!search) return species;
    return species.filter((item) =>
      [item.commonName, item.alternateNames, item.scientificName].some(
        (value) => value?.toLowerCase().includes(search),
      ),
    );
  }, [species, speciesSearch]);
  const filteredBreeds = useMemo(() => {
    const search = breedSearch.trim().toLowerCase();
    return breeds.filter((breed) => {
      if (
        breedSpeciesFilter !== "all" &&
        breed.speciesId !== breedSpeciesFilter
      )
        return false;
      if (!search) return true;
      const parent = speciesById.get(breed.speciesId);
      return [
        breed.commonName,
        breed.alternateNames,
        parent?.commonName,
        parent?.scientificName,
      ].some((value) => value?.toLowerCase().includes(search));
    });
  }, [breedSearch, breedSpeciesFilter, breeds, speciesById]);

  const sortSpecies = (items: Species[]) =>
    [...items].sort((left, right) =>
      label(left.commonName, left.id).localeCompare(
        label(right.commonName, right.id),
      ),
    );
  const sortBreeds = (items: Breed[]) =>
    [...items].sort((left, right) =>
      label(left.commonName, left.id).localeCompare(
        label(right.commonName, right.id),
      ),
    );

  const load = async () => {
    setStatus({ kind: "loading", text: "Loading species records..." });
    try {
      const [speciesCountResponse, breedCountResponse, speciesRecords] =
        await Promise.all([
          api.countSpecies(),
          api.countBreeds(),
          fetchAllPages((params) => api.listSpecies(params)),
        ]);
      const sortedSpecies = sortSpecies(speciesRecords);
      setSpeciesCount(speciesCountResponse.count);
      setBreedCount(breedCountResponse.count);
      setSpecies(sortedSpecies);
      setBreeds([]);
      setBreedSpeciesFilter("all");
      setSelectedBreedId(null);
      setBreedEditorOpen(false);
      setBreedDraft(blankBreed());
      const speciesId =
        selectedSpeciesId &&
        sortedSpecies.some((item) => item.id === selectedSpeciesId)
          ? selectedSpeciesId
          : (sortedSpecies[0]?.id ?? null);
      setSelectedSpeciesId(speciesId);
      setSpeciesDraft(
        speciesId
          ? toSpeciesInput(sortedSpecies.find((item) => item.id === speciesId)!)
          : blankSpecies(),
      );
      setStatus({
        kind: "ok",
        text:
          "Loaded " +
          sortedSpecies.length +
          " species. Select a species to load breeds.",
      });
    } catch (error) {
      setStatus({ kind: "error", text: "Could not load species records." });
      onRequestError(
        "Could not load species records",
        error,
        "Could not load species and breeds.",
      );
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const loadBreedsForSpecies = async (speciesId: string): Promise<void> => {
    setStatus({ kind: "loading", text: "Loading breeds..." });
    try {
      const records = await fetchAllPages((params) =>
        api.listBreedsBySpecies(speciesId, params),
      );
      const sorted = sortBreeds(records);
      setBreeds(sorted);
      setSelectedBreedId(null);
      setBreedEditorOpen(false);
      setBreedDraft({ ...blankBreed(), speciesId });
      setStatus({
        kind: "ok",
        text: "Loaded " + sorted.length + " breeds for the selected species.",
      });
    } catch (error) {
      setStatus({ kind: "error", text: "Could not load breeds." });
      onRequestError(
        "Could not load breeds",
        error,
        "Could not load breeds for the selected species.",
      );
    }
  };

  const selectSpecies = (item: Species) => {
    setSelectedSpeciesId(item.id);
    setSpeciesDraft(toSpeciesInput(item));
  };
  const newSpecies = () => {
    setSelectedSpeciesId(null);
    setSpeciesDraft(blankSpecies());
    setTab("species");
  };
  const selectBreed = (item: Breed) => {
    setSelectedBreedId(item.id);
    setBreedEditorOpen(true);
    setBreedDraft(toBreedInput(item));
  };
  const newBreed = () => {
    setSelectedBreedId(null);
    setBreedEditorOpen(true);
    setBreedDraft(
      breedSpeciesFilter === "all"
        ? blankBreed()
        : { ...blankBreed(), speciesId: breedSpeciesFilter },
    );
  };
  const changeTab = (nextTab: SpeciesTab) => {
    setTab(nextTab);
    if (nextTab === "species") {
      setSelectedSpeciesId(null);
      setSpeciesDraft(blankSpecies());
    } else {
      setSelectedBreedId(null);
      setBreedEditorOpen(false);
      setBreedDraft(
        breedSpeciesFilter === "all"
          ? blankBreed()
          : { ...blankBreed(), speciesId: breedSpeciesFilter },
      );
    }
  };
  const changeBreedSpeciesFilter = (speciesId: string) => {
    setBreedSpeciesFilter(speciesId);
    setSelectedBreedId(null);
    setBreedEditorOpen(false);
    setBreedDraft(
      speciesId === "all" ? blankBreed() : { ...blankBreed(), speciesId },
    );
    if (speciesId === "all") {
      setBreeds([]);
      return;
    }
    void loadBreedsForSpecies(speciesId);
  };
  const openSpeciesBreeds = (speciesId: string) => {
    const item = species.find((value) => value.id === speciesId);
    if (item) selectSpecies(item);
    setBreedSpeciesFilter(speciesId);
    setBreedSearch("");
    setTab("breeds");
    void loadBreedsForSpecies(speciesId);
  };

  const returnToSpecies = () => {
    setSelectedBreedId(null);
    setBreedDraft(
      breedSpeciesFilter === "all"
        ? blankBreed()
        : { ...blankBreed(), speciesId: breedSpeciesFilter },
    );
    setTab("species");
  };

  const saveSpecies = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: SpeciesInput = {
      commonName: cleanText(speciesDraft.commonName),
      alternateNames: cleanText(speciesDraft.alternateNames),
      scientificName: cleanText(speciesDraft.scientificName),
    };
    setSaving(true);
    try {
      const response = selectedSpeciesId
        ? await api.updateSpecies(selectedSpeciesId, input)
        : await api.createSpecies(input);
      const next = selectedSpeciesId
        ? species.map((item) =>
            item.id === selectedSpeciesId ? response.data : item,
          )
        : [...species, response.data];
      setSpecies(sortSpecies(next));
      if (!selectedSpeciesId) setSpeciesCount((current) => current + 1);
      setSelectedSpeciesId(response.data.id);
      setSpeciesDraft(toSpeciesInput(response.data));
      setStatus({
        kind: "ok",
        text: selectedSpeciesId ? "Species updated." : "Species created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save species",
        error,
        "Could not save species.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveBreed = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: BreedInput = {
      commonName: cleanText(breedDraft.commonName),
      alternateNames: cleanText(breedDraft.alternateNames),
      speciesId: breedDraft.speciesId,
    };
    setSaving(true);
    try {
      const response = selectedBreedId
        ? await api.updateBreed(selectedBreedId, input)
        : await api.createBreed(input);
      const shouldShow =
        breedSpeciesFilter === "all" ||
        response.data.speciesId === breedSpeciesFilter;
      const withoutCurrent = breeds.filter(
        (item) => item.id !== response.data.id,
      );
      setBreeds(
        sortBreeds(
          shouldShow ? [...withoutCurrent, response.data] : withoutCurrent,
        ),
      );
      if (!selectedBreedId) setBreedCount((current) => current + 1);
      setSelectedBreedId(response.data.id);
      setBreedEditorOpen(true);
      setBreedDraft(toBreedInput(response.data));
      setStatus({
        kind: "ok",
        text: selectedBreedId ? "Breed updated." : "Breed created.",
      });
    } catch (error) {
      onRequestError("Could not save breed", error, "Could not save breed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteSpecies = async () => {
    if (!selectedSpeciesId) return;
    const selected = species.find((item) => item.id === selectedSpeciesId);
    if (
      !window.confirm(
        "Delete species " +
          label(selected?.commonName, selectedSpeciesId) +
          "?",
      )
    )
      return;
    setSaving(true);
    try {
      await api.deleteSpecies(selectedSpeciesId);
      const next = species.filter((item) => item.id !== selectedSpeciesId);
      setSpecies(next);
      setSpeciesCount((current) => Math.max(0, current - 1));
      setSelectedSpeciesId(null);
      setSpeciesDraft(blankSpecies());
      if (breedSpeciesFilter === selectedSpeciesId) {
        setBreedSpeciesFilter("all");
        setBreeds([]);
      }
      setStatus({ kind: "ok", text: "Species deleted." });
    } catch (error) {
      onRequestError(
        "Could not delete species",
        error,
        "Could not delete species.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteBreed = async () => {
    if (!selectedBreedId) return;
    const selected = breeds.find((item) => item.id === selectedBreedId);
    if (
      !window.confirm(
        "Delete breed " + label(selected?.commonName, selectedBreedId) + "?",
      )
    )
      return;
    setSaving(true);
    try {
      await api.deleteBreed(selectedBreedId);
      setBreeds(breeds.filter((item) => item.id !== selectedBreedId));
      setBreedCount((current) => Math.max(0, current - 1));
      setSelectedBreedId(null);
      setBreedEditorOpen(false);
      setBreedDraft(
        breedSpeciesFilter === "all"
          ? blankBreed()
          : { ...blankBreed(), speciesId: breedSpeciesFilter },
      );
      setStatus({ kind: "ok", text: "Breed deleted." });
    } catch (error) {
      onRequestError(
        "Could not delete breed",
        error,
        "Could not delete breed.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="summary" aria-label="Species summary">
        <Metric value={speciesCount} label="Species" />
        <Metric value={breedCount} label="Breeds" />
        <button
          className="metric-action secondary"
          type="button"
          onClick={() => void load()}
        >
          <RefreshCw size={17} />
          Refresh data
        </button>
      </section>
      <Status status={status} />
      <section className="geo-workspace species-workspace">
        <SpeciesListPane
          rows={filteredSpecies.map((item) => ({
            id: item.id,
            primary: label(item.commonName, "Unnamed species"),
            secondary: [item.scientificName, item.alternateNames]
              .filter(Boolean)
              .join(" / "),
          }))}
          search={speciesSearch}
          selectedId={selectedSpeciesId}
          onSearchChange={setSpeciesSearch}
          onSelect={(id) => {
            const item = species.find((value) => value.id === id);
            if (item) {
              selectSpecies(item);
              setTab("species");
            }
          }}
          onDrill={openSpeciesBreeds}
          onAdd={newSpecies}
        />
        <section className="species-detail">
          {tab === "species" ? (
            <aside className="editor">
              <SpeciesForm
                draft={speciesDraft}
                selectedId={selectedSpeciesId}
                saving={saving}
                onDraft={setSpeciesDraft}
                onSubmit={saveSpecies}
                onNew={newSpecies}
                onDelete={deleteSpecies}
              />
            </aside>
          ) : (
            <BreedListWorkspace
              rows={filteredBreeds.map((breed) => ({
                id: breed.id,
                primary: label(breed.commonName, "Unnamed breed"),
                secondary: [
                  breed.alternateNames,
                  label(
                    speciesById.get(breed.speciesId)?.commonName,
                    "No species",
                  ),
                ]
                  .filter(Boolean)
                  .join(" / "),
              }))}
              search={breedSearch}
              selectedId={selectedBreedId}
              emptyText={
                breedSpeciesFilter === "all"
                  ? "Open a species to load breeds."
                  : "No breeds match the current filters."
              }
              onSearchChange={setBreedSearch}
              onSelect={(id) => {
                const item = breeds.find((value) => value.id === id);
                if (item) selectBreed(item);
              }}
              onBack={returnToSpecies}
              onAdd={newBreed}
            >
              {breedEditorOpen ? (
                <aside className="editor">
                  <BreedForm
                    draft={breedDraft}
                    selectedId={selectedBreedId}
                    saving={saving}
                    species={species}
                    onDraft={setBreedDraft}
                    onSubmit={saveBreed}
                    onNew={newBreed}
                    onDelete={deleteBreed}
                  />
                </aside>
              ) : (
                <EmptyState text="Select a breed or add a new one." />
              )}
            </BreedListWorkspace>
          )}
        </section>
      </section>
    </>
  );
}
