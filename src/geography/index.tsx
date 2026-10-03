import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Metric, Status, EmptyState, cleanText, label } from "../shared";
import {
  CityForm,
  CityListWorkspace,
  CountryForm,
  CountryListPane,
  StateForm,
  StateListWorkspace,
} from "./components";
import type { ApiClient } from "../shared";
import type {
  AdministrativeState,
  AdministrativeStateInput,
  City,
  CityInput,
  Country,
  CountryInput,
} from "../shared";

type GeographyTab = "countries" | "states" | "cities";
type StatusState = { kind: "idle" | "ok" | "error" | "loading"; text: string };
type RequestErrorHandler = (
  title: string,
  error: unknown,
  fallback: string,
) => void;

const PAGE_SIZE = 30;

const blankCountry = (): CountryInput => ({
  name: "",
  namePTBR: "",
  abbreviation: "",
  bacenCode: null,
});
const blankState = (): AdministrativeStateInput => ({
  name: "",
  abbreviation: "",
  ibgeCode: null,
  countryId: null,
  callCodes: "",
});
const blankCity = (): CityInput => ({
  name: "",
  stateId: null,
  ibgeCode: null,
});

const toCountryInput = (country: Country): CountryInput => ({
  name: country.name,
  namePTBR: country.namePTBR,
  abbreviation: country.abbreviation,
  bacenCode: country.bacenCode,
});
const toStateInput = (
  state: AdministrativeState,
): AdministrativeStateInput => ({
  name: state.name,
  abbreviation: state.abbreviation,
  ibgeCode: state.ibgeCode,
  countryId: state.countryId,
  callCodes: state.callCodes,
});
const toCityInput = (city: City): CityInput => ({
  name: city.name,
  stateId: city.stateId,
  ibgeCode: city.ibgeCode,
});

const cleanNumber = (value: number | null): number | null =>
  Number.isFinite(value) ? value : null;
export function GeographyEditor({
  api,
  onRequestError,
}: {
  api: ApiClient;
  onRequestError: RequestErrorHandler;
}) {
  const [tab, setTab] = useState<GeographyTab>("countries");
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<AdministrativeState[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [countryCount, setCountryCount] = useState(0);
  const [countryOffset, setCountryOffset] = useState(0);
  const [countryHasMore, setCountryHasMore] = useState(true);
  const [countryLoadingMore, setCountryLoadingMore] = useState(false);
  const countryLoadingRef = useRef(false);
  const [stateCount, setStateCount] = useState(0);
  const [stateOffset, setStateOffset] = useState(0);
  const [stateHasMore, setStateHasMore] = useState(false);
  const [stateLoadingMore, setStateLoadingMore] = useState(false);
  const stateLoadingRef = useRef(false);
  const [cityCount, setCityCount] = useState(0);
  const [cityOffset, setCityOffset] = useState(0);
  const [cityHasMore, setCityHasMore] = useState(false);
  const [cityLoadingMore, setCityLoadingMore] = useState(false);
  const cityLoadingRef = useRef(false);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(
    null,
  );
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [stateEditorOpen, setStateEditorOpen] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [cityEditorOpen, setCityEditorOpen] = useState(false);
  const [countryDraft, setCountryDraft] = useState<CountryInput>(blankCountry);
  const [stateDraft, setStateDraft] =
    useState<AdministrativeStateInput>(blankState);
  const [cityDraft, setCityDraft] = useState<CityInput>(blankCity);
  const [status, setStatus] = useState<StatusState>({ kind: "idle", text: "" });
  const [saving, setSaving] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [stateCountryFilter, setStateCountryFilter] = useState("all");
  const [cityStateFilter, setCityStateFilter] = useState("all");

  const countryById = useMemo(
    () => new Map(countries.map((country) => [country.id, country])),
    [countries],
  );
  const stateById = useMemo(
    () => new Map(states.map((state) => [state.id, state])),
    [states],
  );

  const sortAll = (
    nextCountries: Country[],
    nextStates: AdministrativeState[],
    nextCities: City[],
  ) => ({
    countries: [...nextCountries].sort((left, right) =>
      label(left.namePTBR ?? left.name, left.id).localeCompare(
        label(right.namePTBR ?? right.name, right.id),
      ),
    ),
    states: [...nextStates].sort((left, right) => {
      const leftCountry = label(
        countryById.get(left.countryId ?? "")?.namePTBR ??
          countryById.get(left.countryId ?? "")?.name,
        "",
      );
      const rightCountry = label(
        countryById.get(right.countryId ?? "")?.namePTBR ??
          countryById.get(right.countryId ?? "")?.name,
        "",
      );
      return (
        leftCountry.localeCompare(rightCountry) ||
        label(left.name, left.id).localeCompare(label(right.name, right.id))
      );
    }),
    cities: [...nextCities].sort((left, right) => {
      const leftState = label(stateById.get(left.stateId ?? "")?.name, "");
      const rightState = label(stateById.get(right.stateId ?? "")?.name, "");
      return (
        leftState.localeCompare(rightState) ||
        label(left.name, left.id).localeCompare(label(right.name, right.id))
      );
    }),
  });

  const loadCountriesPage = async (
    reset = false,
    search = countrySearch,
  ): Promise<void> => {
    if (countryLoadingRef.current) return;
    countryLoadingRef.current = true;
    const offset = reset ? 0 : countryOffset;
    setCountryLoadingMore(true);
    if (reset)
      setStatus({ kind: "loading", text: "Loading geography records..." });
    try {
      const [
        countryCountResponse,
        stateCountResponse,
        cityCountResponse,
        countryPage,
      ] = await Promise.all([
        reset ? api.countCountries() : Promise.resolve({ count: countryCount }),
        reset ? api.countStates() : Promise.resolve({ count: stateCount }),
        reset ? api.countCities() : Promise.resolve({ count: cityCount }),
        api.listCountries({
          limit: PAGE_SIZE,
          offset,
          search: search || undefined,
        }),
      ]);
      const nextCountries = reset
        ? sortCountries(countryPage.data)
        : sortCountries([
            ...countries,
            ...countryPage.data.filter(
              (item) => !countries.some((current) => current.id === item.id),
            ),
          ]);
      const nextOffset = offset + countryPage.data.length;

      setCountryCount(countryCountResponse.count);
      setStateCount(stateCountResponse.count);
      setCityCount(cityCountResponse.count);
      setCountries(nextCountries);
      setCountryOffset(nextOffset);
      setCountryHasMore(
        countryPage.data.length === PAGE_SIZE &&
          (!search || nextOffset < countryCountResponse.count),
      );
      if (reset) {
        setStates([]);
        setCities([]);
        setStateOffset(0);
        setStateHasMore(false);
        setStateLoadingMore(false);
        setCityOffset(0);
        setCityHasMore(false);
        setStateCountryFilter("all");
        setCityStateFilter("all");
        setSelectedStateId(null);
        setStateEditorOpen(false);
        setSelectedCityId(null);
        setStateDraft(blankState());
        setCityDraft(blankCity());
        const countryId =
          selectedCountryId &&
          nextCountries.some((item) => item.id === selectedCountryId)
            ? selectedCountryId
            : (nextCountries[0]?.id ?? null);
        setSelectedCountryId(countryId);
        setCountryDraft(
          countryId
            ? toCountryInput(
                nextCountries.find((item) => item.id === countryId)!,
              )
            : blankCountry(),
        );
        setStatus({
          kind: "ok",
          text:
            "Loaded " +
            nextCountries.length +
            " of " +
            countryCountResponse.count +
            " countries. Select a country to load states, then a state to load cities.",
        });
      }
    } catch (error) {
      setStatus({ kind: "error", text: "Could not load geography records." });
      onRequestError(
        "Could not load geography records",
        error,
        "Could not load countries, states, and cities.",
      );
    } finally {
      countryLoadingRef.current = false;
      setCountryLoadingMore(false);
    }
  };

  const load = async () => {
    await loadCountriesPage(true);
  };

  useEffect(() => {
    void load();
  }, []);

  const loadStatesForCountry = async (
    countryId: string,
    reset = true,
    search = stateSearch,
  ): Promise<void> => {
    if (stateLoadingRef.current) return;
    stateLoadingRef.current = true;
    const offset = reset ? 0 : stateOffset;
    setStateLoadingMore(true);
    if (reset) setStatus({ kind: "loading", text: "Loading states..." });
    try {
      const page = await api.listStatesByCountry(countryId, {
        limit: PAGE_SIZE,
        offset,
        search: search || undefined,
      });
      const nextStates = reset
        ? sortStates(page.data)
        : sortStates([
            ...states,
            ...page.data.filter(
              (item) => !states.some((current) => current.id === item.id),
            ),
          ]);
      const nextOffset = offset + page.data.length;
      setStates(nextStates);
      setStateOffset(nextOffset);
      setStateHasMore(page.data.length === PAGE_SIZE);
      if (reset) {
        setCities([]);
        setCityOffset(0);
        setCityHasMore(false);
        setCityStateFilter("all");
        setSelectedStateId(null);
        setStateEditorOpen(false);
        setSelectedCityId(null);
        setStateDraft({ ...blankState(), countryId });
        setCityDraft(blankCity());
        setStatus({
          kind: "ok",
          text:
            "Loaded " + nextStates.length + " states for the selected country.",
        });
      }
    } catch (error) {
      setStatus({ kind: "error", text: "Could not load states." });
      onRequestError(
        "Could not load states",
        error,
        "Could not load states for the selected country.",
      );
    } finally {
      stateLoadingRef.current = false;
      setStateLoadingMore(false);
    }
  };

  const loadCitiesForState = async (
    stateId: string,
    reset = true,
    search = citySearch,
  ): Promise<void> => {
    if (cityLoadingRef.current) return;
    cityLoadingRef.current = true;
    const offset = reset ? 0 : cityOffset;
    setCityLoadingMore(true);
    if (reset) setStatus({ kind: "loading", text: "Loading cities..." });
    try {
      const page = await api.listCitiesByState(stateId, {
        limit: PAGE_SIZE,
        offset,
        search: search || undefined,
      });
      const nextCities = reset
        ? sortCities(page.data)
        : sortCities([
            ...cities,
            ...page.data.filter(
              (item) => !cities.some((current) => current.id === item.id),
            ),
          ]);
      const nextOffset = offset + page.data.length;
      setCities(nextCities);
      setCityOffset(nextOffset);
      setCityHasMore(page.data.length === PAGE_SIZE);
      if (reset) {
        setSelectedCityId(null);
        setCityEditorOpen(false);
        setCityDraft({ ...blankCity(), stateId });
        setStatus({
          kind: "ok",
          text:
            "Loaded " + nextCities.length + " cities for the selected state.",
        });
      }
    } catch (error) {
      setStatus({ kind: "error", text: "Could not load cities." });
      onRequestError(
        "Could not load cities",
        error,
        "Could not load cities for the selected state.",
      );
    } finally {
      cityLoadingRef.current = false;
      setCityLoadingMore(false);
    }
  };

  const selectCountry = (country: Country) => {
    setSelectedCountryId(country.id);
    setCountryDraft(toCountryInput(country));
  };
  const newCountry = () => {
    setSelectedCountryId(null);
    setCountryDraft(blankCountry());
    setTab("countries");
  };
  const returnToCountryEditor = () => {
    setSelectedStateId(null);
    setStateEditorOpen(false);
    setTab("countries");
  };
  const selectState = (state: AdministrativeState) => {
    setSelectedStateId(state.id);
    setStateEditorOpen(true);
    setStateDraft(toStateInput(state));
  };
  const newState = () => {
    setSelectedStateId(null);
    setStateEditorOpen(true);
    setStateDraft({
      ...blankState(),
      countryId: stateCountryFilter === "all" ? null : stateCountryFilter,
    });
  };
  const selectCity = (city: City) => {
    setSelectedCityId(city.id);
    setCityEditorOpen(true);
    setCityDraft(toCityInput(city));
  };
  const newCity = () => {
    setSelectedCityId(null);
    setCityEditorOpen(true);
    setCityDraft({
      ...blankCity(),
      stateId: cityStateFilter === "all" ? null : cityStateFilter,
    });
  };

  const clearTabEditor = (nextTab: GeographyTab) => {
    if (nextTab === "countries") {
      setSelectedCountryId(null);
      setCountryDraft(blankCountry());
    } else if (nextTab === "states") {
      setSelectedStateId(null);
      setStateEditorOpen(false);
      setStateDraft(blankState());
    } else {
      setSelectedCityId(null);
      setCityEditorOpen(false);
      setCityDraft(blankCity());
    }
  };

  const changeTab = (nextTab: GeographyTab) => {
    setTab(nextTab);
    clearTabEditor(nextTab);
  };

  const changeStateCountryFilter = (countryId: string) => {
    setStateCountryFilter(countryId);
    setSelectedStateId(null);
    setStateEditorOpen(false);
    setStateDraft(blankState());
    setCities([]);
    setCityOffset(0);
    setCityHasMore(false);
    setCityStateFilter("all");
    setSelectedCityId(null);
    setCityEditorOpen(false);
    setCityDraft(blankCity());
    if (countryId === "all") {
      setStates([]);
      setStateOffset(0);
      setStateHasMore(false);
      return;
    }
    void loadStatesForCountry(countryId, true, stateSearch);
  };

  const changeCityStateFilter = (stateId: string) => {
    setCityStateFilter(stateId);
    setSelectedCityId(null);
    setCityEditorOpen(false);
    setCityDraft(blankCity());
    if (stateId === "all") {
      setCities([]);
      setCityOffset(0);
      setCityHasMore(false);
      return;
    }
    void loadCitiesForState(stateId, true, citySearch);
  };

  const openCountryStates = (countryId: string) => {
    const country = countries.find((item) => item.id === countryId);
    if (country) selectCountry(country);
    setStateCountryFilter(countryId);
    setStateSearch("");
    setTab("states");
    void loadStatesForCountry(countryId, true, "");
  };

  const openStateCities = (stateId: string) => {
    const state = states.find((item) => item.id === stateId);
    if (state) selectState(state);
    setStateEditorOpen(false);
    setCityStateFilter(stateId);
    setCitySearch("");
    setTab("cities");
    void loadCitiesForState(stateId, true, "");
  };

  const returnToStates = () => {
    setSelectedCityId(null);
    setCityEditorOpen(false);
    setCityDraft({
      ...blankCity(),
      stateId: cityStateFilter === "all" ? null : cityStateFilter,
    });
    setStateEditorOpen(false);
    setTab("states");
  };

  const saveCountry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: CountryInput = {
      name: cleanText(countryDraft.name),
      namePTBR: cleanText(countryDraft.namePTBR),
      abbreviation: cleanText(countryDraft.abbreviation),
      bacenCode: cleanNumber(countryDraft.bacenCode),
    };
    setSaving(true);
    try {
      const response = selectedCountryId
        ? await api.updateCountry(selectedCountryId, input)
        : await api.createCountry(input);
      const next = selectedCountryId
        ? countries.map((item) =>
            item.id === selectedCountryId ? response.data : item,
          )
        : [...countries, response.data];
      const sorted = sortAll(next, states, cities).countries;
      setCountries(sorted);
      if (!selectedCountryId) setCountryCount((current) => current + 1);
      setSelectedCountryId(response.data.id);
      setCountryDraft(toCountryInput(response.data));
      setStatus({
        kind: "ok",
        text: selectedCountryId ? "Country updated." : "Country created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save country",
        error,
        "Could not save country.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveState = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: AdministrativeStateInput = {
      name: cleanText(stateDraft.name),
      abbreviation: cleanText(stateDraft.abbreviation),
      ibgeCode: cleanNumber(stateDraft.ibgeCode),
      countryId: stateDraft.countryId || null,
      callCodes: cleanText(stateDraft.callCodes),
    };
    setSaving(true);
    try {
      const response = selectedStateId
        ? await api.updateState(selectedStateId, input)
        : await api.createState(input);
      const next = selectedStateId
        ? states.map((item) =>
            item.id === selectedStateId ? response.data : item,
          )
        : [...states, response.data];
      const sorted = sortAll(countries, next, cities).states;
      setStates(sorted);
      if (!selectedStateId) setStateCount((current) => current + 1);
      setSelectedStateId(response.data.id);
      setStateEditorOpen(true);
      setStateDraft(toStateInput(response.data));
      setStatus({
        kind: "ok",
        text: selectedStateId ? "State updated." : "State created.",
      });
    } catch (error) {
      onRequestError("Could not save state", error, "Could not save state.");
    } finally {
      setSaving(false);
    }
  };

  const saveCity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: CityInput = {
      name: cleanText(cityDraft.name),
      stateId: cityDraft.stateId || null,
      ibgeCode: cleanNumber(cityDraft.ibgeCode),
    };
    setSaving(true);
    try {
      const response = selectedCityId
        ? await api.updateCity(selectedCityId, input)
        : await api.createCity(input);
      const next = selectedCityId
        ? cities.map((item) =>
            item.id === selectedCityId ? response.data : item,
          )
        : [...cities, response.data];
      const sorted = sortAll(countries, states, next).cities;
      setCities(sorted);
      if (!selectedCityId) setCityCount((current) => current + 1);
      setSelectedCityId(response.data.id);
      setCityEditorOpen(true);
      setCityDraft(toCityInput(response.data));
      setStatus({
        kind: "ok",
        text: selectedCityId ? "City updated." : "City created.",
      });
    } catch (error) {
      onRequestError("Could not save city", error, "Could not save city.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCountry = async () => {
    if (!selectedCountryId) return;
    const selected = countries.find((item) => item.id === selectedCountryId);
    if (
      !window.confirm(
        "Delete country " +
          label(selected?.namePTBR ?? selected?.name, selectedCountryId) +
          "?",
      )
    )
      return;
    setSaving(true);
    try {
      await api.deleteCountry(selectedCountryId);
      const next = countries.filter((item) => item.id !== selectedCountryId);
      setCountries(next);
      setCountryCount((current) => Math.max(0, current - 1));
      const first = next[0] ?? null;
      setSelectedCountryId(first?.id ?? null);
      setCountryDraft(first ? toCountryInput(first) : blankCountry());
      setStatus({ kind: "ok", text: "Country deleted." });
    } catch (error) {
      onRequestError(
        "Could not delete country",
        error,
        "Could not delete country.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteState = async () => {
    if (!selectedStateId) return;
    const selected = states.find((item) => item.id === selectedStateId);
    if (
      !window.confirm(
        "Delete state " + label(selected?.name, selectedStateId) + "?",
      )
    )
      return;
    setSaving(true);
    try {
      await api.deleteState(selectedStateId);
      const next = states.filter((item) => item.id !== selectedStateId);
      setStates(next);
      setStateCount((current) => Math.max(0, current - 1));
      const first = next[0] ?? null;
      setSelectedStateId(null);
      setStateEditorOpen(false);
      setStateDraft(blankState());
      setStatus({ kind: "ok", text: "State deleted." });
    } catch (error) {
      onRequestError(
        "Could not delete state",
        error,
        "Could not delete state.",
      );
    } finally {
      setSaving(false);
    }
  };

  const changeCountrySearch = (search: string) => {
    setCountrySearch(search);
    void loadCountriesPage(true, search);
  };

  const changeStateSearch = (search: string) => {
    setStateSearch(search);
    if (stateCountryFilter !== "all")
      void loadStatesForCountry(stateCountryFilter, true, search);
  };

  const changeCitySearch = (search: string) => {
    setCitySearch(search);
    if (cityStateFilter !== "all")
      void loadCitiesForState(cityStateFilter, true, search);
  };

  const deleteCity = async () => {
    if (!selectedCityId) return;
    const selected = cities.find((item) => item.id === selectedCityId);
    if (
      !window.confirm(
        "Delete city " + label(selected?.name, selectedCityId) + "?",
      )
    )
      return;
    setSaving(true);
    try {
      await api.deleteCity(selectedCityId);
      const next = cities.filter((item) => item.id !== selectedCityId);
      setCities(next);
      setCityCount((current) => Math.max(0, current - 1));
      const first = next[0] ?? null;
      setSelectedCityId(null);
      setCityEditorOpen(false);
      setCityDraft(blankCity());
      setStatus({ kind: "ok", text: "City deleted." });
    } catch (error) {
      onRequestError("Could not delete city", error, "Could not delete city.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="summary" aria-label="Geography summary">
        <Metric value={countryCount} label="Countries" />
        <Metric value={stateCount} label="States" />
        <Metric value={cityCount} label="Cities" />
        <button
          className="metric-action secondary"
          type="button"
          onClick={() => void load()}
        >
          <RefreshCw size={17} />
          Refresh data
        </button>
        <button className="metric-action" type="button" onClick={newCountry}>
          <Plus size={17} />
          New country
        </button>
      </section>
      <Status status={status} />
      <section className="geo-workspace geography-workspace">
        <CountryListPane
          rows={countries.map((country) => ({
            id: country.id,
            primary: label(country.namePTBR ?? country.name, "Unnamed country"),
            secondary: [
              country.abbreviation,
              country.bacenCode ? "BACEN " + country.bacenCode : null,
            ]
              .filter(Boolean)
              .join(" / "),
          }))}
          search={countrySearch}
          selectedId={selectedCountryId}
          onSearchChange={changeCountrySearch}
          onSelect={(id) => {
            const country = countries.find((item) => item.id === id);
            if (country) {
              selectCountry(country);
              setTab("countries");
            }
          }}
          onDrill={openCountryStates}
          onLoadMore={
            countryHasMore
              ? () => {
                  void loadCountriesPage(false);
                }
              : undefined
          }
          loadingMore={countryLoadingMore}
        />
        <section className="geography-detail">
          {tab === "countries" ? (
            <aside className="editor">
              <CountryForm
                draft={countryDraft}
                selectedId={selectedCountryId}
                saving={saving}
                onDraft={setCountryDraft}
                onSubmit={saveCountry}
                onNew={newCountry}
                onDelete={deleteCountry}
              />
            </aside>
          ) : tab === "states" ? (
            <StateListWorkspace
              rows={states.map((state) => ({
                id: state.id,
                primary: label(state.name, "Unnamed state"),
                secondary: [
                  state.abbreviation,
                  label(
                    countryById.get(state.countryId ?? "")?.namePTBR ??
                      countryById.get(state.countryId ?? "")?.name,
                    "No country",
                  ),
                ]
                  .filter(Boolean)
                  .join(" / "),
              }))}
              search={stateSearch}
              selectedId={selectedStateId}
              emptyText={
                stateCountryFilter === "all"
                  ? "Open a country to load states."
                  : "No states match the current filters."
              }
              loadingMore={stateLoadingMore}
              onSearchChange={changeStateSearch}
              onSelect={(id) => {
                const state = states.find((item) => item.id === id);
                if (state) selectState(state);
              }}
              onDrill={openStateCities}
              onLoadMore={
                stateHasMore && stateCountryFilter !== "all"
                  ? () => {
                      void loadStatesForCountry(
                        stateCountryFilter,
                        false,
                        stateSearch,
                      );
                    }
                  : undefined
              }
              onBack={returnToCountryEditor}
              onAdd={newState}
            >
              {stateEditorOpen ? (
                <aside className="editor">
                  <StateForm
                    draft={stateDraft}
                    selectedId={selectedStateId}
                    saving={saving}
                    countries={countries}
                    stateCountryFilter={stateCountryFilter}
                    onDraft={setStateDraft}
                    onSubmit={saveState}
                    onNew={newState}
                    onDelete={deleteState}
                  />
                </aside>
              ) : (
                <EmptyState text="Select a state or add a new one." />
              )}
            </StateListWorkspace>
          ) : (
            <CityListWorkspace
              rows={cities.map((city) => ({
                id: city.id,
                primary: label(city.name, "Unnamed city"),
                secondary: [
                  label(stateById.get(city.stateId ?? "")?.name, "No state"),
                  city.ibgeCode ? "IBGE " + city.ibgeCode : null,
                ]
                  .filter(Boolean)
                  .join(" / "),
              }))}
              search={citySearch}
              selectedId={selectedCityId}
              emptyText={
                cityStateFilter === "all"
                  ? "Open a state to load cities."
                  : "No cities match the current filters."
              }
              loadingMore={cityLoadingMore}
              onSearchChange={changeCitySearch}
              onSelect={(id) => {
                const city = cities.find((item) => item.id === id);
                if (city) selectCity(city);
              }}
              onLoadMore={
                cityHasMore && cityStateFilter !== "all"
                  ? () => {
                      void loadCitiesForState(
                        cityStateFilter,
                        false,
                        citySearch,
                      );
                    }
                  : undefined
              }
              onBack={returnToStates}
              onAdd={newCity}
            >
              {cityEditorOpen ? (
                <aside className="editor">
                  <CityForm
                    draft={cityDraft}
                    selectedId={selectedCityId}
                    saving={saving}
                    states={states}
                    cityStateFilter={cityStateFilter}
                    onDraft={setCityDraft}
                    onSubmit={saveCity}
                    onNew={newCity}
                    onDelete={deleteCity}
                  />
                </aside>
              ) : (
                <EmptyState text="Select a city or add a new one." />
              )}
            </CityListWorkspace>
          )}
        </section>
      </section>
    </>
  );
}

function sortCountries(items: Country[]): Country[] {
  return [...items].sort((left, right) =>
    label(left.namePTBR ?? left.name, left.id).localeCompare(
      label(right.namePTBR ?? right.name, right.id),
    ),
  );
}
function sortStates(items: AdministrativeState[]): AdministrativeState[] {
  return [...items].sort((left, right) =>
    label(left.name, left.id).localeCompare(label(right.name, right.id)),
  );
}
function sortCities(items: City[]): City[] {
  return [...items].sort((left, right) =>
    label(left.name, left.id).localeCompare(label(right.name, right.id)),
  );
}
