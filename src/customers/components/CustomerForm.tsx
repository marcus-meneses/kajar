import React, { useEffect, useState } from "react";
import {
  EditorActions,
  EditorHead,
  type AdministrativeState,
  type ApiClient,
  type City,
  type Country,
  type CustomerInput,
  type DictionaryCollection,
  fetchAllPages,
  loadPagedUntil,
  type User,
} from "../../shared";
import { ContactUserPicker } from "./ContactUserPicker";
import {
  DictionaryPickerModal,
  DictionarySelect,
  dictionaryLabel,
} from "./DictionaryPicker";
import { ModalField } from "./ModalField";
import { RecordPickerModal } from "./RecordPickerModal";

type RequestErrorHandler = (
  title: string,
  error: unknown,
  fallback: string,
) => void;

type CityPickerLevel = "countries" | "states" | "cities";
const customerStatuses = ["active", "inactive", "suspended"] as const;
const PAGE_SIZE = 30;

function userLabel(item: User): string {
  return [item.name || item.login || "Unnamed user", item.email]
    .filter(Boolean)
    .join(" - ");
}

function countryLabel(item: Country): string {
  return item.namePTBR || item.name || item.abbreviation || "Unnamed country";
}
function stateLabel(item: AdministrativeState): string {
  return [item.name || "Unnamed state", item.abbreviation]
    .filter(Boolean)
    .join(" - ");
}
function cityLabel(
  item: City,
  stateById: Map<string, AdministrativeState>,
): string {
  const state = item.stateId ? stateById.get(item.stateId) : null;
  return [item.name || "Unnamed city", state?.abbreviation]
    .filter(Boolean)
    .join(" - ");
}
function sortUsers(items: User[]): User[] {
  return [...items].sort((left, right) =>
    userLabel(left).localeCompare(userLabel(right)),
  );
}
function sortCountries(items: Country[]): Country[] {
  return [...items].sort((left, right) =>
    countryLabel(left).localeCompare(countryLabel(right)),
  );
}
function sortStates(items: AdministrativeState[]): AdministrativeState[] {
  return [...items].sort((left, right) =>
    stateLabel(left).localeCompare(stateLabel(right)),
  );
}
function sortCities(items: City[]): City[] {
  return [...items].sort((left, right) =>
    (left.name ?? "").localeCompare(right.name ?? ""),
  );
}
function mergeMap<T extends { id: string }>(
  current: Map<string, T>,
  items: T[],
): Map<string, T> {
  const next = new Map(current);
  items.forEach((item) => next.set(item.id, item));
  return next;
}

export function CustomerForm({
  api,
  selectedCustomerId,
  draft,
  selectedId,
  saving,
  dictionaries,
  onRequestError,
  onDraft,
  onSubmit,
  onNew,
  onDelete,
}: {
  api: ApiClient;
  selectedCustomerId: string | null;
  draft: CustomerInput;
  selectedId: string | null;
  saving: boolean;
  dictionaries: DictionaryCollection;
  onRequestError: RequestErrorHandler;
  onDraft: (draft: CustomerInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNew: () => void;
  onDelete: () => void;
}) {
  const [timezonePickerOpen, setTimezonePickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [cityPickerLevel, setCityPickerLevel] =
    useState<CityPickerLevel>("countries");
  const [contactUserPickerOpen, setContactUserPickerOpen] = useState(false);
  const [countryOptions, setCountryOptions] = useState<Country[]>([]);
  const [stateOptions, setStateOptions] = useState<AdministrativeState[]>([]);
  const [cityOptions, setCityOptions] = useState<City[]>([]);
  const [cityPickerCountryId, setCityPickerCountryId] = useState<string | null>(
    null,
  );
  const [cityPickerStateId, setCityPickerStateId] = useState<string | null>(
    null,
  );
  const [countryOffset, setCountryOffset] = useState(0);
  const [stateOffset, setStateOffset] = useState(0);
  const [cityOffset, setCityOffset] = useState(0);
  const [countryHasMore, setCountryHasMore] = useState(false);
  const [stateHasMore, setStateHasMore] = useState(false);
  const [cityHasMore, setCityHasMore] = useState(false);
  const [cityPickerSearch, setCityPickerSearch] = useState("");
  const [contactUserOptions, setContactUserOptions] = useState<User[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedContactUser, setSelectedContactUser] = useState<User | null>(
    null,
  );
  const [stateById, setStateById] = useState(
    new Map<string, AdministrativeState>(),
  );
  const [pickersLoading, setPickersLoading] = useState(false);
  const enterpriseSizes = dictionaries.enterpriseSize ?? [];
  const enterpriseTypes = dictionaries.enterpriseType ?? [];
  const taxRegimes = dictionaries.enterpriseFiscalRegime ?? [];
  const timeZones = dictionaries.timeZones ?? [];

  useEffect(() => {
    let cancelled = false;
    if (!draft.cityId) {
      setSelectedCity(null);
      return;
    }
    api
      .getCity(draft.cityId)
      .then((response) => {
        if (!cancelled) setSelectedCity(response.data);
      })
      .catch(() => {
        if (!cancelled) setSelectedCity(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api, draft.cityId]);

  useEffect(() => {
    let cancelled = false;
    if (!draft.contactUserId) {
      setSelectedContactUser(null);
      return;
    }
    api
      .getUser(draft.contactUserId)
      .then((response) => {
        if (!cancelled) setSelectedContactUser(response.data);
      })
      .catch(() => {
        if (!cancelled) setSelectedContactUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api, draft.contactUserId]);

  useEffect(() => {
    if (!selectedCity?.stateId || stateById.has(selectedCity.stateId)) return;
    let cancelled = false;
    api
      .getState(selectedCity.stateId)
      .then((response) => {
        if (!cancelled)
          setStateById((current) =>
            new Map(current).set(response.data.id, response.data),
          );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, selectedCity?.stateId, stateById]);

  const loadCityPickerCountries = async (
    reset = true,
    search = cityPickerSearch,
  ) => {
    const offset = reset ? 0 : countryOffset;
    setPickersLoading(true);
    try {
      const page = await api.listCountries({
        limit: PAGE_SIZE,
        offset,
        search: search || undefined,
      });
      const nextCountries = reset
        ? sortCountries(page.data)
        : sortCountries([
            ...countryOptions,
            ...page.data.filter(
              (item) =>
                !countryOptions.some((current) => current.id === item.id),
            ),
          ]);
      setCountryOptions(nextCountries);
      setCountryOffset(offset + page.data.length);
      setCountryHasMore(page.data.length === PAGE_SIZE);
    } catch (error) {
      onRequestError(
        "Could not load countries",
        error,
        "Could not load countries.",
      );
    } finally {
      setPickersLoading(false);
    }
  };

  const resetCityPickerLists = () => {
    setCountryOptions([]);
    setCityPickerCountryId(null);
    setCityPickerStateId(null);
    setStateOptions([]);
    setCityOptions([]);
    setCountryOffset(0);
    setStateOffset(0);
    setCityOffset(0);
    setCountryHasMore(false);
    setStateHasMore(false);
    setCityHasMore(false);
  };

  const openCityPicker = async () => {
    resetCityPickerLists();
    setCityPickerSearch("");

    if (!draft.cityId) {
      setCityPickerLevel("countries");
      setCityPickerOpen(true);
      await loadCityPickerCountries(true);
      return;
    }

    setPickersLoading(true);
    try {
      const city =
        selectedCity?.id === draft.cityId
          ? selectedCity
          : (await api.getCity(draft.cityId)).data;
      const state = city.stateId
        ? (stateById.get(city.stateId) ??
          (await api.getState(city.stateId)).data)
        : null;
      const countryId = state?.countryId ?? null;
      const [countriesResult, statesResult, citiesResult] = await Promise.all([
        loadPagedUntil((params) => api.listCountries(params), countryId),
        countryId
          ? loadPagedUntil(
              (params) => api.listStatesByCountry(countryId, params),
              state?.id ?? null,
            )
          : Promise.resolve({
              rows: [] as AdministrativeState[],
              offset: 0,
              hasMore: false,
            }),
        city.stateId
          ? loadPagedUntil(
              (params) => api.listCitiesByState(city.stateId!, params),
              city.id,
            )
          : Promise.resolve({ rows: [] as City[], offset: 0, hasMore: false }),
      ]);
      setSelectedCity(city);
      setCountryOptions(sortCountries(countriesResult.rows));
      setCountryOffset(countriesResult.offset);
      setCountryHasMore(countriesResult.hasMore);
      setStateOptions(sortStates(statesResult.rows));
      setStateOffset(statesResult.offset);
      setStateHasMore(statesResult.hasMore);
      setCityOptions(sortCities(citiesResult.rows));
      setCityOffset(citiesResult.offset);
      setCityHasMore(citiesResult.hasMore);
      if (state)
        setStateById((current) =>
          mergeMap(current, [state, ...statesResult.rows]),
        );
      setCityPickerCountryId(countryId);
      setCityPickerStateId(city.stateId);
      setCityPickerLevel("cities");
      setCityPickerOpen(true);
    } catch (error) {
      onRequestError(
        "Could not load selected city",
        error,
        "Could not load selected city.",
      );
      setCityPickerLevel("countries");
      setCityPickerOpen(true);
      await loadCityPickerCountries(true);
    } finally {
      setPickersLoading(false);
    }
  };

  const loadCityPickerStatesPage = async (
    countryId: string,
    reset = true,
    search = cityPickerSearch,
  ) => {
    const offset = reset ? 0 : stateOffset;
    setPickersLoading(true);
    try {
      const page = await api.listStatesByCountry(countryId, {
        limit: PAGE_SIZE,
        offset,
        search: search || undefined,
      });
      const nextStates = reset
        ? sortStates(page.data)
        : sortStates([
            ...stateOptions,
            ...page.data.filter(
              (item) => !stateOptions.some((current) => current.id === item.id),
            ),
          ]);
      setStateOptions(nextStates);
      setStateOffset(offset + page.data.length);
      setStateHasMore(page.data.length === PAGE_SIZE);
      setStateById((current) => mergeMap(current, page.data));
    } catch (error) {
      onRequestError("Could not load states", error, "Could not load states.");
    } finally {
      setPickersLoading(false);
    }
  };

  const loadCityPickerStates = async (countryId: string) => {
    setCityPickerLevel("states");
    setCityPickerCountryId(countryId);
    setCityPickerStateId(null);
    setStateOptions([]);
    setCityOptions([]);
    setCityPickerSearch("");
    setStateOffset(0);
    setCityOffset(0);
    setStateHasMore(false);
    setCityHasMore(false);
    await loadCityPickerStatesPage(countryId, true);
  };

  const loadCityPickerCitiesPage = async (
    stateId: string,
    reset = true,
    search = cityPickerSearch,
  ) => {
    const offset = reset ? 0 : cityOffset;
    setPickersLoading(true);
    try {
      const page = await api.listCitiesByState(stateId, {
        limit: PAGE_SIZE,
        offset,
        search: search || undefined,
      });
      const nextCities = reset
        ? sortCities(page.data)
        : sortCities([
            ...cityOptions,
            ...page.data.filter(
              (item) => !cityOptions.some((current) => current.id === item.id),
            ),
          ]);
      setCityOptions(nextCities);
      setCityOffset(offset + page.data.length);
      setCityHasMore(page.data.length === PAGE_SIZE);
    } catch (error) {
      onRequestError("Could not load cities", error, "Could not load cities.");
    } finally {
      setPickersLoading(false);
    }
  };

  const loadCityPickerCities = async (stateId: string) => {
    setCityPickerLevel("cities");
    setCityPickerStateId(stateId);
    setCityOptions([]);
    setCityPickerSearch("");
    setCityOffset(0);
    setCityHasMore(false);
    await loadCityPickerCitiesPage(stateId, true);
  };

  const selectCityPickerRow = (id: string | null) => {
    if (!id) return;
    if (cityPickerLevel === "countries") {
      void loadCityPickerStates(id);
      return;
    }
    if (cityPickerLevel === "states") {
      void loadCityPickerCities(id);
      return;
    }
    const city = cityOptions.find((item) => item.id === id) ?? null;
    setSelectedCity(city);
    onDraft({ ...draft, cityId: id });
    setCityPickerOpen(false);
  };

  const cityPickerRows =
    cityPickerLevel === "countries"
      ? countryOptions.map((country) => ({
          id: country.id,
          primary: countryLabel(country),
          secondary: [
            country.abbreviation,
            country.bacenCode ? "BACEN " + country.bacenCode : null,
          ]
            .filter(Boolean)
            .join(" / "),
        }))
      : cityPickerLevel === "states"
        ? stateOptions.map((state) => ({
            id: state.id,
            primary: stateLabel(state),
            secondary: state.callCodes ?? "",
          }))
        : cityOptions.map((city) => ({
            id: city.id,
            primary: cityLabel(city, stateById),
            secondary: "",
          }));
  const cityPickerTitle =
    cityPickerLevel === "countries"
      ? "country"
      : cityPickerLevel === "states"
        ? "state"
        : "city";
  const cityPickerSelectedId =
    cityPickerLevel === "countries"
      ? cityPickerCountryId
      : cityPickerLevel === "states"
        ? cityPickerStateId
        : draft.cityId;
  const cityPickerHasMore =
    cityPickerLevel === "countries"
      ? countryHasMore
      : cityPickerLevel === "states"
        ? stateHasMore
        : cityHasMore;
  const returnCityPickerLevel =
    cityPickerLevel === "states"
      ? () => {
          setCityPickerSearch("");
          setCityPickerLevel("countries");
        }
      : cityPickerLevel === "cities"
        ? () => {
            setCityPickerSearch("");
            setCityPickerLevel("states");
          }
        : undefined;
  const loadMoreCityPickerRows = () => {
    if (pickersLoading || !cityPickerHasMore) return;
    if (cityPickerLevel === "countries") {
      void loadCityPickerCountries(false);
      return;
    }
    if (cityPickerLevel === "states" && cityPickerCountryId) {
      void loadCityPickerStatesPage(cityPickerCountryId, false);
      return;
    }
    if (cityPickerLevel === "cities" && cityPickerStateId) {
      void loadCityPickerCitiesPage(cityPickerStateId, false);
    }
  };
  const searchCityPickerRows = (search: string) => {
    setCityPickerSearch(search);
    if (cityPickerLevel === "countries") {
      void loadCityPickerCountries(true, search);
      return;
    }
    if (cityPickerLevel === "states" && cityPickerCountryId) {
      void loadCityPickerStatesPage(cityPickerCountryId, true, search);
      return;
    }
    if (cityPickerLevel === "cities" && cityPickerStateId) {
      void loadCityPickerCitiesPage(cityPickerStateId, true, search);
    }
  };

  const openContactUserPicker = async () => {
    setContactUserPickerOpen(true);
    setContactUserOptions([]);
    if (!selectedCustomerId) return;
    setPickersLoading(true);
    try {
      const userRecords = await fetchAllPages((params) =>
        api.listUsersByCustomer(selectedCustomerId, params),
      );
      setContactUserOptions(sortUsers(userRecords));
    } catch (error) {
      onRequestError("Could not load users", error, "Could not load users.");
    } finally {
      setPickersLoading(false);
    }
  };

  const contactUser =
    contactUserOptions.find((item) => item.id === draft.contactUserId) ??
    selectedContactUser;

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit customer" : "New customer"}
        id={selectedId}
      />
      <div className="tax-frame-row tax-frame-row-3">
        <label>
          Status
          <select
            value={draft.status}
            onChange={(event) =>
              onDraft({
                ...draft,
                status: event.target.value as CustomerInput["status"],
              })
            }
          >
            {customerStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </div>
      <div className="tax-frame-row tax-frame-row-3">
        <label>
          Fiscal name
          <input
            value={draft.fiscalName}
            onChange={(event) =>
              onDraft({ ...draft, fiscalName: event.target.value })
            }
            required
          />
        </label>
        <label>
          Name
          <input
            value={draft.name ?? ""}
            onChange={(event) =>
              onDraft({ ...draft, name: event.target.value })
            }
          />
        </label>
        <label>
          Discount
          <input
            type="number"
            step="0.01"
            value={draft.discount ?? ""}
            onChange={(event) =>
              onDraft({
                ...draft,
                discount:
                  event.target.value === "" ? null : Number(event.target.value),
              })
            }
          />
        </label>
      </div>
      <div className="tax-frame-row tax-frame-row-3">
        <label>
          CNPJ
          <input
            value={draft.cnpj ?? ""}
            onChange={(event) =>
              onDraft({ ...draft, cnpj: event.target.value })
            }
          />
        </label>
        <label>
          Phone
          <input
            value={draft.phone ?? ""}
            onChange={(event) =>
              onDraft({ ...draft, phone: event.target.value })
            }
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={draft.email ?? ""}
            onChange={(event) =>
              onDraft({ ...draft, email: event.target.value })
            }
          />
        </label>
      </div>
      <label>
        State subscription
        <input
          value={draft.stateSubscription ?? ""}
          onChange={(event) =>
            onDraft({ ...draft, stateSubscription: event.target.value })
          }
        />
      </label>
      <div className="tax-frame-row tax-frame-row-2">
        <label>
          Address
          <input
            value={draft.address ?? ""}
            onChange={(event) =>
              onDraft({ ...draft, address: event.target.value })
            }
          />
        </label>
        <label>
          CEP
          <input
            value={draft.cep ?? ""}
            onChange={(event) => onDraft({ ...draft, cep: event.target.value })}
          />
        </label>
      </div>
      <div className="tax-frame-row tax-frame-row-2">
        <ModalField
          label="City"
          value={
            selectedCity
              ? cityLabel(selectedCity, stateById)
              : "No city selected"
          }
          required
          onChoose={() => void openCityPicker()}
        />
        <ModalField
          label="Contact user"
          value={
            contactUser ? userLabel(contactUser) : "No contact user selected"
          }
          onChoose={() => void openContactUserPicker()}
          onClear={() => onDraft({ ...draft, contactUserId: null })}
        />
      </div>
      <div className="tax-frame-row tax-frame-row-3">
        <DictionarySelect
          label="Enterprise size"
          value={draft.enterpriseSize}
          entries={enterpriseSizes}
          onChange={(value) => onDraft({ ...draft, enterpriseSize: value })}
          required
        />
        <DictionarySelect
          label="Enterprise type"
          value={draft.enterpriseType}
          entries={enterpriseTypes}
          onChange={(value) => onDraft({ ...draft, enterpriseType: value })}
          required
        />
        <DictionarySelect
          label="Tax regime"
          value={draft.taxRegime}
          entries={taxRegimes}
          onChange={(value) => onDraft({ ...draft, taxRegime: value })}
          required
        />
      </div>
      <fieldset className="parent-field timezone-field">
        <legend>Timezone</legend>
        <div className="parent-summary">
          <span>{dictionaryLabel(timeZones, draft.timezone)}</span>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setTimezonePickerOpen(true)}
          >
            Choose
          </button>
        </div>
      </fieldset>
      <EditorActions
        saving={saving}
        selected={Boolean(selectedId)}
        newLabel="New customer"
        saveLabel={selectedId ? "Save customer" : "Create customer"}
        onNew={onNew}
        onDelete={onDelete}
        hideNew
      />
      {timezonePickerOpen && (
        <DictionaryPickerModal
          title="Timezone"
          entries={timeZones}
          selectedValue={draft.timezone}
          onSelect={(value) => {
            onDraft({ ...draft, timezone: value });
            setTimezonePickerOpen(false);
          }}
          onClose={() => setTimezonePickerOpen(false)}
        />
      )}
      {cityPickerOpen && (
        <RecordPickerModal
          title={cityPickerTitle}
          rows={cityPickerRows}
          selectedId={cityPickerSelectedId}
          loading={pickersLoading}
          search={cityPickerSearch}
          onSearchChange={searchCityPickerRows}
          serverSearch
          onSelect={selectCityPickerRow}
          onClose={() => setCityPickerOpen(false)}
          onBack={returnCityPickerLevel}
          onLoadMore={cityPickerHasMore ? loadMoreCityPickerRows : undefined}
          loadingMore={pickersLoading && cityPickerRows.length > 0}
        />
      )}
      {contactUserPickerOpen && (
        <ContactUserPicker
          users={contactUserOptions}
          selectedId={draft.contactUserId}
          loading={pickersLoading}
          onSelect={(id, user) => {
            setSelectedContactUser(user);
            onDraft({ ...draft, contactUserId: id });
            setContactUserPickerOpen(false);
          }}
          onClose={() => setContactUserPickerOpen(false)}
        />
      )}
    </form>
  );
}
