import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, Save, Search, X } from "lucide-react";
import {
  EditorActions,
  EditorHead,
  type ApiClient,
  type AdministrativeState,
  type City,
  type Country,
  type DictionaryCollection,
  type DictionaryEntry,
  type FiscalCategory,
  type FiscalCEST,
  type FiscalCFOP,
  type FiscalClassTrib,
  type FiscalFrame,
  type FiscalFrameInput,
  type FiscalFrameTax,
  type FiscalFrameTaxInput,
  type FiscalPolicySet,
  type TaxRule,
  cleanText,
  fetchAllPages,
  mergeById,
  type TaxRuleInput,
} from "../../shared";

type RequestErrorHandler = (
  title: string,
  error: unknown,
  fallback: string,
) => void;
type PickerRow = { id: string; primary: string; secondary: string };
type TreeRow = PickerRow & { depth: number };
type PickerState = {
  title: string;
  rows: PickerRow[];
  selectedId: string | null;
  nullable?: boolean;
  loading?: boolean;
  onSelect: (id: string | null) => void;
} | null;
type DictionaryPickerState = {
  title: string;
  entries: DictionaryEntry[];
  selectedValue: string | null;
  nullable?: boolean;
  onSelect: (value: string | null) => void;
} | null;

const toNumber = (
  value: string | number | null | undefined,
  fallback = 0,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
function dictionaryValue(entry: DictionaryEntry): string {
  return String(entry.abbreviation ?? entry.acronym ?? entry.index ?? "");
}
function dictionaryOptionLabel(entry: DictionaryEntry): string {
  return dictionaryValue(entry) + " - " + entry.description;
}
function countryLabel(
  country: Country | undefined,
  fallback: string | null | undefined,
): string {
  return country
    ? [country.name, country.namePTBR, country.abbreviation]
        .filter(Boolean)
        .join(" / ")
    : fallback
      ? "Selected country"
      : "None";
}
function stateLabel(
  state: AdministrativeState | undefined,
  fallback: string | null | undefined,
): string {
  return state
    ? [state.name, state.abbreviation].filter(Boolean).join(" / ")
    : fallback
      ? "Selected state"
      : "None";
}
function cityLabel(
  city: City | undefined,
  fallback: string | null | undefined,
): string {
  return city
    ? [city.name, city.ibgeCode].filter(Boolean).join(" / ")
    : fallback
      ? "Selected city"
      : "None";
}
function fiscalCategoryLabel(
  item: FiscalCategory | undefined,
  fallback: string | null | undefined,
): string {
  return item
    ? item.code + " - " + item.description
    : fallback
      ? "Selected fiscal NCM"
      : "None";
}
function fiscalNbsLabel(
  item: FiscalCategory | undefined,
  fallback: string | null | undefined,
): string {
  return item
    ? item.code + " - " + item.description
    : fallback
      ? "Selected fiscal NBS"
      : "None";
}
function cfopLabel(
  item: FiscalCFOP | undefined,
  fallback: string | null | undefined,
): string {
  return item
    ? item.code + " - " + item.description
    : fallback
      ? "Selected fiscal CFOP"
      : "None";
}
function cestLabel(
  item: FiscalCEST | undefined,
  fallback: string | null | undefined,
): string {
  return item
    ? item.code + " - " + item.description
    : fallback
      ? "Selected fiscal CEST"
      : "None";
}
function classTribLabel(
  item: FiscalClassTrib | undefined,
  fallback: string | null | undefined,
): string {
  return item
    ? item.code + " - " + item.name
    : fallback
      ? "Selected fiscal ClassTrib"
      : "None";
}
function countryRow(item: Country): PickerRow {
  return {
    id: item.id,
    primary: countryLabel(item, item.id),
    secondary: item.id,
  };
}
function stateRow(item: AdministrativeState): PickerRow {
  return {
    id: item.id,
    primary: stateLabel(item, item.id),
    secondary: item.id,
  };
}
function cityRow(item: City): PickerRow {
  return { id: item.id, primary: cityLabel(item, item.id), secondary: item.id };
}
function cfopRow(item: FiscalCFOP): PickerRow {
  return { id: item.id, primary: item.code, secondary: item.description };
}
function cestRow(item: FiscalCEST): PickerRow {
  return { id: item.id, primary: item.code, secondary: item.description };
}
function classTribRow(item: FiscalClassTrib): PickerRow {
  return { id: item.id, primary: item.code, secondary: item.name };
}
function sortCountries(items: Country[]): Country[] {
  return [...items].sort((left, right) =>
    (left.name ?? "").localeCompare(right.name ?? ""),
  );
}
function sortStates(items: AdministrativeState[]): AdministrativeState[] {
  return [...items].sort((left, right) =>
    (left.name ?? "").localeCompare(right.name ?? ""),
  );
}
function sortCities(items: City[]): City[] {
  return [...items].sort((left, right) =>
    (left.name ?? "").localeCompare(right.name ?? ""),
  );
}
function sortFiscalCategories(items: FiscalCategory[]): FiscalCategory[] {
  return [...items].sort((left, right) => left.code.localeCompare(right.code));
}
function sortFiscalCFOPs(items: FiscalCFOP[]): FiscalCFOP[] {
  return [...items].sort((left, right) => left.code.localeCompare(right.code));
}
function ruleLabel(rule: TaxRule): string {
  return "#" + rule.numericId + " " + rule.name;
}
function frameLabel(frame: FiscalFrame): string {
  return [
    "#" + frame.numericId,
    frame.version,
    frame.countryId,
    frame.stateId,
    frame.itemType,
    frame.taxRegime,
  ]
    .filter(Boolean)
    .join(" / ");
}
function frameTaxLabel(tax: FiscalFrameTax): string {
  return "#" + tax.numericId + " " + tax.taxCode;
}
function buildFiscalCategoryTreeRows(
  items: FiscalCategory[],
  query: string,
  expandedIds: string[],
): TreeRow[] {
  const needle = query.trim().toLowerCase();
  const children = new Map<string, FiscalCategory[]>();
  for (const item of items)
    children.set(item.parent ?? "", [
      ...(children.get(item.parent ?? "") ?? []),
      item,
    ]);
  for (const list of children.values())
    list.sort((left, right) => left.code.localeCompare(right.code));
  const rows: TreeRow[] = [];
  const visit = (item: FiscalCategory, depth: number) => {
    const matches =
      !needle ||
      [item.code, item.description].some((value) =>
        value.toLowerCase().includes(needle),
      );
    if (matches)
      rows.push({
        id: item.id,
        primary: item.code,
        secondary: item.description,
        depth,
      });
    if ((needle || expandedIds.includes(item.id)) && children.has(item.id))
      for (const child of children.get(item.id) ?? []) visit(child, depth + 1);
  };
  for (const root of children.get("") ?? []) visit(root, 0);
  return rows;
}

export function FrameForm({
  api,
  draft,
  selectedId,
  saving,
  dictionaries,
  policySets,
  onDraft,
  onSubmit,
  onRequestError,
  onNew,
  onDelete,
}: {
  api: ApiClient;
  draft: FiscalFrameInput;
  selectedId: string | null;
  saving: boolean;
  dictionaries: DictionaryCollection;
  policySets: FiscalPolicySet[];
  onDraft: (draft: FiscalFrameInput) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onRequestError: RequestErrorHandler;
  onNew: () => void;
  onDelete: () => void;
}) {
  const [picker, setPicker] = useState<PickerState>(null);
  const [dictionaryPicker, setDictionaryPicker] =
    useState<DictionaryPickerState>(null);
  const [countryById, setCountryById] = useState(new Map<string, Country>());
  const [stateById, setStateById] = useState(
    new Map<string, AdministrativeState>(),
  );
  const [cityById, setCityById] = useState(new Map<string, City>());
  const [ncmById, setNcmById] = useState(new Map<string, FiscalCategory>());
  const [nbsById, setNbsById] = useState(new Map<string, FiscalCategory>());
  const [cestById, setCestById] = useState(new Map<string, FiscalCEST>());
  const [cfopById, setCfopById] = useState(new Map<string, FiscalCFOP>());
  const [classTribById, setClassTribById] = useState(
    new Map<string, FiscalClassTrib>(),
  );
  const [ncmPickerOpen, setNcmPickerOpen] = useState(false);
  const [ncmRecords, setNcmRecords] = useState<FiscalCategory[]>([]);
  const [ncmExpanded, setNcmExpanded] = useState<string[]>([]);
  const [ncmLoadedChildren, setNcmLoadedChildren] = useState<string[]>([]);
  const [ncmLoadingChildren, setNcmLoadingChildren] = useState<string[]>([]);
  const [ncmRootLoading, setNcmRootLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSelectedReferences = async () => {
      const tasks: Promise<void>[] = [];

      if (draft.countryId && !countryById.has(draft.countryId)) {
        tasks.push(
          api.getCountry(draft.countryId).then((response) => {
            if (!cancelled)
              setCountryById((current) => mergeById(current, [response.data]));
          }),
        );
      }

      if (draft.stateId && !stateById.has(draft.stateId)) {
        tasks.push(
          api.getState(draft.stateId).then((response) => {
            if (!cancelled)
              setStateById((current) => mergeById(current, [response.data]));
          }),
        );
      }

      if (draft.cityId && !cityById.has(draft.cityId)) {
        tasks.push(
          api.getCity(draft.cityId).then((response) => {
            if (!cancelled)
              setCityById((current) => mergeById(current, [response.data]));
          }),
        );
      }

      if (draft.fiscalNCMId && !ncmById.has(draft.fiscalNCMId)) {
        tasks.push(
          api.getFiscalNCM(draft.fiscalNCMId).then((response) => {
            if (!cancelled)
              setNcmById((current) => mergeById(current, [response.data]));
          }),
        );
      }

      if (draft.fiscalCESTId && !cestById.has(draft.fiscalCESTId)) {
        tasks.push(
          api.getFiscalCEST(draft.fiscalCESTId).then((response) => {
            if (!cancelled)
              setCestById((current) => mergeById(current, [response.data]));
          }),
        );
      }

      if (draft.fiscalCFOPId && !cfopById.has(draft.fiscalCFOPId)) {
        tasks.push(
          api.getFiscalCFOP(draft.fiscalCFOPId).then((response) => {
            if (!cancelled)
              setCfopById((current) => mergeById(current, [response.data]));
          }),
        );
      }

      if (
        draft.fiscalClassTribId &&
        !classTribById.has(draft.fiscalClassTribId)
      ) {
        tasks.push(
          api.getFiscalClassTrib(draft.fiscalClassTribId).then((response) => {
            if (!cancelled)
              setClassTribById((current) =>
                mergeById(current, [response.data]),
              );
          }),
        );
      }

      if (!tasks.length) return;
      await Promise.all(tasks);
    };

    void loadSelectedReferences().catch((error) => {
      if (!cancelled)
        onRequestError(
          "Could not load selected fiscal frame references",
          error,
          "Could not load selected fiscal frame references.",
        );
    });

    return () => {
      cancelled = true;
    };
  }, [
    api,
    draft.countryId,
    draft.stateId,
    draft.cityId,
    draft.fiscalNCMId,
    draft.fiscalCFOPId,
  ]);

  const dictionaryEntries = (name: string) => dictionaries[name] ?? [];
  const dictionaryLabel = (name: string, value: string | null | undefined) => {
    if (!value) return "None";
    const entry = dictionaryEntries(name).find(
      (item) => dictionaryValue(item) === value,
    );
    return entry ? dictionaryOptionLabel(entry) : value;
  };
  const chooseDictionary = (
    title: string,
    name: string,
    value: string | null | undefined,
    nullable: boolean,
    onSelect: (value: string | null) => void,
  ) =>
    setDictionaryPicker({
      title,
      entries: dictionaryEntries(name),
      selectedValue: value ?? null,
      nullable,
      onSelect,
    });
  const chooseRows = async (
    title: string,
    selectedId: string | null,
    nullable: boolean,
    loadRows: () => Promise<PickerRow[]>,
    onSelect: (id: string | null) => void,
  ) => {
    setPicker({
      title,
      rows: [],
      selectedId,
      nullable,
      loading: true,
      onSelect,
    });
    try {
      const rows = await loadRows();
      setPicker({
        title,
        rows,
        selectedId,
        nullable,
        loading: false,
        onSelect,
      });
    } catch (error) {
      setPicker(null);
      onRequestError(
        "Could not load " + title.toLowerCase(),
        error,
        "Could not load picker records.",
      );
    }
  };
  const openCountryPicker = () =>
    void chooseRows(
      "Country",
      draft.countryId,
      false,
      async () => {
        const countries = sortCountries(
          await fetchAllPages((params) => api.listCountries(params)),
        );
        setCountryById((current) => mergeById(current, countries));
        return countries.map(countryRow);
      },
      (id) =>
        onDraft({ ...draft, countryId: id ?? "", stateId: null, cityId: null }),
    );
  const openStatePicker = () =>
    void chooseRows(
      "State",
      draft.stateId ?? null,
      true,
      async () => {
        const states = draft.countryId
          ? sortStates(
              await fetchAllPages((params) =>
                api.listStatesByCountry(draft.countryId, params),
              ),
            )
          : [];
        setStateById((current) => mergeById(current, states));
        return states.map(stateRow);
      },
      (id) => onDraft({ ...draft, stateId: id, cityId: null }),
    );
  const openCityPicker = () =>
    void chooseRows(
      "City",
      draft.cityId ?? null,
      true,
      async () => {
        const cities = draft.stateId
          ? sortCities(
              await fetchAllPages((params) =>
                api.listCitiesByState(draft.stateId!, params),
              ),
            )
          : [];
        setCityById((current) => mergeById(current, cities));
        return cities.map(cityRow);
      },
      (id) => onDraft({ ...draft, cityId: id }),
    );
  const openNcmPicker = () => {
    setNcmPickerOpen(true);
    if (ncmRecords.length || ncmRootLoading) return;
    setNcmRootLoading(true);
    void fetchAllPages((params) => api.listFiscalNCMRoots(params))
      .then((roots) => {
        const sorted = sortFiscalCategories(roots);
        setNcmRecords(sorted);
        setNcmById((current) => mergeById(current, sorted));
      })
      .catch((error) => {
        setNcmPickerOpen(false);
        onRequestError(
          "Could not load fiscal NCM",
          error,
          "Could not load fiscal NCM roots.",
        );
      })
      .finally(() => setNcmRootLoading(false));
  };
  const toggleNcmNode = async (id: string) => {
    const isOpen = ncmExpanded.includes(id);
    if (isOpen) {
      setNcmExpanded((current) => current.filter((item) => item !== id));
      return;
    }
    setNcmExpanded((current) => [...current, id]);
    if (ncmLoadedChildren.includes(id) || ncmLoadingChildren.includes(id))
      return;
    setNcmLoadingChildren((current) => [...current, id]);
    try {
      const children = sortFiscalCategories(
        await fetchAllPages((params) => api.listFiscalNCMChildren(id, params)),
      );
      setNcmRecords((current) =>
        sortFiscalCategories([
          ...current.filter(
            (item) => !children.some((child) => child.id === item.id),
          ),
          ...children,
        ]),
      );
      setNcmById((current) => mergeById(current, children));
      setNcmLoadedChildren((current) => [...current, id]);
    } catch (error) {
      onRequestError(
        "Could not load fiscal NCM children",
        error,
        "Could not load fiscal NCM children.",
      );
    } finally {
      setNcmLoadingChildren((current) => current.filter((item) => item !== id));
    }
  };
  const selectNcm = (id: string | null) => {
    onDraft({ ...draft, fiscalNCMId: id });
    setNcmPickerOpen(false);
  };
  const openCfopPicker = () =>
    void chooseRows(
      "Fiscal CFOP",
      draft.fiscalCFOPId ?? null,
      true,
      async () => {
        const cfops = sortFiscalCFOPs(
          await fetchAllPages((params) => api.listFiscalCFOPs(params)),
        );
        setCfopById((current) => mergeById(current, cfops));
        return cfops.map(cfopRow);
      },
      (id) => onDraft({ ...draft, fiscalCFOPId: id }),
    );
  const openNbsPicker = () =>
    void chooseRows(
      "Fiscal NBS",
      draft.fiscalNBSId ?? null,
      true,
      async () => {
        const records = sortFiscalCategories(
          await fetchAllPages((params) => api.listFiscalNBS(params)),
        );
        setNbsById((current) => mergeById(current, records));
        return records.map((item) => ({
          id: item.id,
          primary: item.code,
          secondary: item.description,
        }));
      },
      (id) => onDraft({ ...draft, fiscalNBSId: id }),
    );

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <EditorHead
        title={selectedId ? "Edit fiscal frame" : "New fiscal frame"}
        id={selectedId}
      />
      <div className="tax-frame-row tax-frame-row-2">
        <label>
          Policy set
          <select
            value={draft.policySetId}
            onChange={(event) =>
              onDraft({ ...draft, policySetId: event.target.value })
            }
            required
          >
            <option value="">Select a policy set</option>
            {policySets.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.code} v{policy.version} - {policy.name} ({policy.status})
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <input
            type="number"
            step="1"
            value={draft.priority}
            onChange={(event) =>
              onDraft({ ...draft, priority: Number(event.target.value) })
            }
            required
          />
        </label>
      </div>
      <div className="tax-frame-row tax-frame-row-2">
        <label>
          Operation
          <select
            value={draft.operation}
            onChange={(event) =>
              onDraft({
                ...draft,
                operation: event.target.value as FiscalFrameInput["operation"],
              })
            }
          >
            <option>Sale</option>
            <option>Service</option>
          </select>
        </label>
        <label>
          Buyer type
          <select
            value={draft.buyerType ?? ""}
            onChange={(event) =>
              onDraft({
                ...draft,
                buyerType: (event.target.value || null) as FiscalFrameInput["buyerType"],
              })
            }
          >
            <option value="">Any</option>
            <option>Consumer</option>
            <option>Taxpayer</option>
            <option>Government</option>
          </select>
        </label>
      </div>
      <label>
        Version
        <input
          value={draft.version}
          onChange={(event) =>
            onDraft({ ...draft, version: event.target.value })
          }
          required
        />
      </label>
      <ValuePicker
        label="Origin"
        value={dictionaryLabel("originCode", draft.originCode)}
        required
        onChoose={() =>
          chooseDictionary(
            "Origin",
            "originCode",
            draft.originCode,
            false,
            (value) => onDraft({ ...draft, originCode: value ?? "" }),
          )
        }
      />
      <div className="tax-frame-row tax-frame-row-2">
        <label>
          Jurisdiction
          <select
            value={draft.jurisdiction}
            onChange={(event) =>
              onDraft({
                ...draft,
                jurisdiction: event.target
                  .value as FiscalFrameInput["jurisdiction"],
              })
            }
          >
            <option>Country</option>
            <option>State</option>
            <option>City</option>
          </select>
        </label>
        <label>
          Item type
          <select
            value={draft.itemType}
            onChange={(event) =>
              onDraft({
                ...draft,
                itemType: event.target.value as FiscalFrameInput["itemType"],
              })
            }
          >
            <option>Product</option>
            <option>Service</option>
          </select>
        </label>
      </div>
      <div className="tax-frame-row tax-frame-row-2">
        <ValuePicker
          label="Fiscal NBS"
          value={fiscalNbsLabel(
            nbsById.get(draft.fiscalNBSId ?? ""),
            draft.fiscalNBSId,
          )}
          onChoose={openNbsPicker}
          onClear={() => onDraft({ ...draft, fiscalNBSId: null })}
        />
      </div>
      <div className="tax-frame-row tax-frame-row-3">
        <ValuePicker
          label="Country"
          value={countryLabel(
            countryById.get(draft.countryId),
            draft.countryId,
          )}
          required
          onChoose={openCountryPicker}
        />
        <ValuePicker
          label="State"
          value={stateLabel(stateById.get(draft.stateId ?? ""), draft.stateId)}
          onChoose={openStatePicker}
          onClear={() => onDraft({ ...draft, stateId: null, cityId: null })}
        />
        <ValuePicker
          label="City"
          value={cityLabel(cityById.get(draft.cityId ?? ""), draft.cityId)}
          onChoose={openCityPicker}
          onClear={() => onDraft({ ...draft, cityId: null })}
        />
      </div>
      <div className="tax-frame-row tax-frame-row-3">
        <ValuePicker
          label="Enterprise size"
          value={dictionaryLabel("enterpriseSize", draft.enterpriseSize)}
          onChoose={() =>
            chooseDictionary(
              "Enterprise size",
              "enterpriseSize",
              draft.enterpriseSize,
              true,
              (value) => onDraft({ ...draft, enterpriseSize: value }),
            )
          }
          onClear={() => onDraft({ ...draft, enterpriseSize: null })}
        />
        <ValuePicker
          label="Enterprise type"
          value={dictionaryLabel("enterpriseType", draft.enterpriseType)}
          onChoose={() =>
            chooseDictionary(
              "Enterprise type",
              "enterpriseType",
              draft.enterpriseType,
              true,
              (value) => onDraft({ ...draft, enterpriseType: value }),
            )
          }
          onClear={() => onDraft({ ...draft, enterpriseType: null })}
        />
        <ValuePicker
          label="Tax regime"
          value={dictionaryLabel("enterpriseFiscalRegime", draft.taxRegime)}
          onChoose={() =>
            chooseDictionary(
              "Tax regime",
              "enterpriseFiscalRegime",
              draft.taxRegime,
              true,
              (value) => onDraft({ ...draft, taxRegime: value }),
            )
          }
          onClear={() => onDraft({ ...draft, taxRegime: null })}
        />
      </div>
      <div className="tax-frame-row tax-frame-row-2">
        <ValuePicker
          label="Fiscal NCM"
          value={fiscalCategoryLabel(
            ncmById.get(draft.fiscalNCMId ?? ""),
            draft.fiscalNCMId,
          )}
          onChoose={openNcmPicker}
          onClear={() => onDraft({ ...draft, fiscalNCMId: null })}
        />
        <ValuePicker
          label="Fiscal CFOP"
          value={cfopLabel(
            cfopById.get(draft.fiscalCFOPId ?? ""),
            draft.fiscalCFOPId,
          )}
          onChoose={openCfopPicker}
          onClear={() => onDraft({ ...draft, fiscalCFOPId: null })}
        />
      </div>
      <div className="tax-frame-row tax-frame-row-2">
        <ValuePicker
          label="Fiscal CEST"
          value={cestLabel(
            cestById.get(draft.fiscalCESTId ?? ""),
            draft.fiscalCESTId,
          )}
          onChoose={() =>
            chooseRows(
              "Fiscal CEST",
              draft.fiscalCESTId ?? null,
              true,
              async () => {
                const items = await fetchAllPages((params) =>
                  api.listFiscalCESTs(params),
                );
                setCestById((current) => mergeById(current, items));
                return items.map(cestRow);
              },
              (id) => onDraft({ ...draft, fiscalCESTId: id }),
            )
          }
          onClear={() => onDraft({ ...draft, fiscalCESTId: null })}
        />
        <ValuePicker
          label="Fiscal ClassTrib"
          value={classTribLabel(
            classTribById.get(draft.fiscalClassTribId ?? ""),
            draft.fiscalClassTribId,
          )}
          onChoose={() =>
            chooseRows(
              "Fiscal ClassTrib",
              draft.fiscalClassTribId ?? null,
              true,
              async () => {
                const items = await fetchAllPages((params) =>
                  api.listFiscalClassTribs(params),
                );
                setClassTribById((current) => mergeById(current, items));
                return items.map(classTribRow);
              },
              (id) => onDraft({ ...draft, fiscalClassTribId: id }),
            )
          }
          onClear={() => onDraft({ ...draft, fiscalClassTribId: null })}
        />
      </div>
      <div className="tax-frame-row tax-frame-row-2">
        <ValuePicker
          label="CST IPI"
          value={dictionaryLabel("cstIpi", draft.cstIpi)}
          onChoose={() =>
            chooseDictionary("CST IPI", "cstIpi", draft.cstIpi, true, (value) =>
              onDraft({ ...draft, cstIpi: value }),
            )
          }
          onClear={() => onDraft({ ...draft, cstIpi: null })}
        />
        <ValuePicker
          label="CST PIS"
          value={dictionaryLabel("cstPis", draft.cstPis)}
          onChoose={() =>
            chooseDictionary("CST PIS", "cstPis", draft.cstPis, true, (value) =>
              onDraft({ ...draft, cstPis: value }),
            )
          }
          onClear={() => onDraft({ ...draft, cstPis: null })}
        />
      </div>
      <div className="tax-frame-row tax-frame-row-2">
        <ValuePicker
          label="CST COFINS"
          value={dictionaryLabel("cstCofins", draft.cstCofins)}
          onChoose={() =>
            chooseDictionary(
              "CST COFINS",
              "cstCofins",
              draft.cstCofins,
              true,
              (value) => onDraft({ ...draft, cstCofins: value }),
            )
          }
          onClear={() => onDraft({ ...draft, cstCofins: null })}
        />
        <ValuePicker
          label="CSOSN"
          value={dictionaryLabel("CSOSN", draft.CSOSN)}
          onChoose={() =>
            chooseDictionary("CSOSN", "CSOSN", draft.CSOSN, true, (value) =>
              onDraft({ ...draft, CSOSN: value }),
            )
          }
          onClear={() => onDraft({ ...draft, CSOSN: null })}
        />
      </div>
      <ValuePicker
        label="CST ICMS"
        value={dictionaryLabel("cstICMS", draft.cstIcms)}
        onChoose={() =>
          chooseDictionary(
            "CST ICMS",
            "cstICMS",
            draft.cstIcms,
            true,
            (value) => onDraft({ ...draft, cstIcms: value }),
          )
        }
        onClear={() => onDraft({ ...draft, cstIcms: null })}
      />
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
        newLabel="New frame"
        saveLabel={selectedId ? "Save frame" : "Create frame"}
        onNew={onNew}
        onDelete={onDelete}
      />
      {picker && (
        <RecordPickerModal picker={picker} onClose={() => setPicker(null)} />
      )}
      {ncmPickerOpen && (
        <NcmPickerModal
          rows={buildFiscalCategoryTreeRows(ncmRecords, "", ncmExpanded)}
          selectedId={draft.fiscalNCMId ?? null}
          expanded={ncmExpanded}
          loading={[
            ...(ncmRootLoading ? ["__root__"] : []),
            ...ncmLoadingChildren,
          ]}
          onToggle={(id) => void toggleNcmNode(id)}
          onSelect={selectNcm}
          onClose={() => setNcmPickerOpen(false)}
        />
      )}
      {dictionaryPicker && (
        <DictionaryPickerModal
          picker={dictionaryPicker}
          onClose={() => setDictionaryPicker(null)}
        />
      )}
    </form>
  );
}

function ValuePicker({
  label,
  value,
  required,
  onChoose,
  onClear,
}: {
  label: string;
  value: string;
  required?: boolean;
  onChoose: () => void;
  onClear?: () => void;
}) {
  return (
    <fieldset className="parent-field">
      <legend>
        {label}
        {required ? " *" : ""}
      </legend>
      <div className="parent-summary">
        <span>{value || "None"}</span>
        <div>
          <button className="secondary-button" type="button" onClick={onChoose}>
            <Search size={16} />
            Choose
          </button>
          {onClear && value !== "None" && (
            <button
              className="secondary-button"
              type="button"
              onClick={onClear}
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>
    </fieldset>
  );
}
function RecordPickerModal({
  picker,
  onClose,
}: {
  picker: NonNullable<PickerState>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const needle = search.trim().toLowerCase();
  const rows = needle
    ? picker.rows.filter((row) =>
        (row.primary + " " + row.secondary).toLowerCase().includes(needle),
      )
    : picker.rows;
  const select = (id: string | null) => {
    picker.onSelect(id);
    onClose();
  };
  return createPortal(
    <div className="modal-backdrop">
      <section className="modal parent-picker" role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>Choose {picker.title}</h2>
        </header>
        <div className="modal-body parent-picker-body">
          <label className="search-field geo-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              placeholder={"Search " + picker.title.toLowerCase()}
            />
          </label>
          {picker.nullable && (
            <div className="parent-picker-root">
              <button
                className={
                  "record-main " + (!picker.selectedId ? "selected-parent" : "")
                }
                type="button"
                onClick={() => select(null)}
              >
                <strong>None</strong>
                <span>No selected value</span>
              </button>
            </div>
          )}
          <div className="parent-picker-list">
            {picker.loading ? (
              <div className="empty-state geo-empty">Loading...</div>
            ) : rows.length ? (
              rows.map((row) => (
                <div
                  key={row.id}
                  className={
                    "record-row " +
                    (row.id === picker.selectedId ? "selected" : "")
                  }
                >
                  <button
                    className="record-main"
                    type="button"
                    onClick={() => select(row.id)}
                  >
                    <strong>{row.primary}</strong>
                    <span>{row.secondary}</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state geo-empty">
                No records match the current search.
              </div>
            )}
          </div>
        </div>
        <footer className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            <X size={16} />
            Cancel
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
function NcmPickerModal({
  rows,
  selectedId,
  expanded,
  loading,
  onToggle,
  onSelect,
  onClose,
}: {
  rows: TreeRow[];
  selectedId: string | null;
  expanded: string[];
  loading: string[];
  onToggle: (id: string) => void;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const needle = search.trim().toLowerCase();
  const visibleRows = needle
    ? rows.filter((row) =>
        (row.primary + " " + row.secondary).toLowerCase().includes(needle),
      )
    : rows;
  const rootLoading = loading.includes("__root__");
  const select = (id: string | null) => {
    onSelect(id);
  };
  return createPortal(
    <div className="modal-backdrop">
      <section className="modal parent-picker" role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>Choose Fiscal NCM</h2>
        </header>
        <div className="modal-body parent-picker-body">
          <label className="search-field geo-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              placeholder="Search loaded fiscal NCM"
            />
          </label>
          <div className="parent-picker-root">
            <button
              className={
                "record-main " + (!selectedId ? "selected-parent" : "")
              }
              type="button"
              onClick={() => select(null)}
            >
              <strong>None</strong>
              <span>No selected fiscal NCM</span>
            </button>
          </div>
          <div className="parent-picker-list">
            {rootLoading ? (
              <div className="empty-state geo-empty">Loading...</div>
            ) : visibleRows.length ? (
              visibleRows.map((row) => (
                <div
                  key={row.id}
                  className={
                    "record-row tree-row " +
                    (row.id === selectedId ? "selected" : "")
                  }
                  style={
                    { "--tree-depth": String(row.depth) } as React.CSSProperties
                  }
                >
                  <button
                    className="record-main"
                    type="button"
                    onClick={() => select(row.id)}
                  >
                    <strong>{row.primary}</strong>
                    <span>
                      {loading.includes(row.id)
                        ? "Loading children..."
                        : row.secondary}
                    </span>
                  </button>
                  <button
                    className={
                      "record-drill tree-toggle " +
                      (expanded.includes(row.id) ? "expanded" : "")
                    }
                    type="button"
                    title="Load child entries"
                    onClick={() => onToggle(row.id)}
                  >
                    <ChevronDown size={17} />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state geo-empty">
                No loaded fiscal NCM records match the current search.
              </div>
            )}
          </div>
        </div>
        <footer className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            <X size={16} />
            Cancel
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
function DictionaryPickerModal({
  picker,
  onClose,
}: {
  picker: NonNullable<DictionaryPickerState>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const needle = search.trim().toLowerCase();
  const rows = needle
    ? picker.entries.filter((entry) =>
        dictionaryOptionLabel(entry).toLowerCase().includes(needle),
      )
    : picker.entries;
  const select = (value: string | null) => {
    picker.onSelect(value);
    onClose();
  };
  return createPortal(
    <div className="modal-backdrop">
      <section className="modal parent-picker" role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>Choose {picker.title}</h2>
        </header>
        <div className="modal-body parent-picker-body">
          <label className="search-field geo-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              placeholder={"Search " + picker.title.toLowerCase()}
            />
          </label>
          {picker.nullable && (
            <div className="parent-picker-root">
              <button
                className={
                  "record-main " +
                  (!picker.selectedValue ? "selected-parent" : "")
                }
                type="button"
                onClick={() => select(null)}
              >
                <strong>None</strong>
                <span>No selected value</span>
              </button>
            </div>
          )}
          <div className="parent-picker-list">
            {rows.length ? (
              rows.map((entry) => {
                const value = dictionaryValue(entry);
                return (
                  <div
                    key={value}
                    className={
                      "record-row " +
                      (value === picker.selectedValue ? "selected" : "")
                    }
                  >
                    <button
                      className="record-main"
                      type="button"
                      onClick={() => select(value)}
                    >
                      <strong>{value}</strong>
                      <span>{entry.description}</span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="empty-state geo-empty">
                No dictionary values match the current search.
              </div>
            )}
          </div>
        </div>
        <footer className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            <X size={16} />
            Cancel
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
function DateFields({
  dateStart,
  dateEnd,
  onChange,
}: {
  dateStart: string;
  dateEnd: string | null | undefined;
  onChange: (dateStart: string, dateEnd: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <fieldset className="parent-field">
      <legend>Dates</legend>
      <div className="parent-summary">
        <span>
          {"Start: " +
            (dateStart || "Not set") +
            " / End: " +
            (dateEnd || "No end date")}
        </span>
        <div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setOpen(true)}
          >
            <CalendarDays size={16} />
            Choose
          </button>
          {dateEnd && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => onChange(dateStart, null)}
            >
              <X size={16} />
              Clear end
            </button>
          )}
        </div>
      </div>
      {open && (
        <DatePickerModal
          dateStart={dateStart}
          dateEnd={dateEnd ?? null}
          onSelect={(nextStart, nextEnd) => {
            onChange(nextStart, nextEnd);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </fieldset>
  );
}
function DatePickerModal({
  dateStart,
  dateEnd,
  onSelect,
  onClose,
}: {
  dateStart: string;
  dateEnd: string | null;
  onSelect: (dateStart: string, dateEnd: string | null) => void;
  onClose: () => void;
}) {
  const [nextStart, setNextStart] = useState(dateStart);
  const [nextEnd, setNextEnd] = useState(dateEnd ?? "");
  return createPortal(
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>Choose dates</h2>
        </header>
        <div className="modal-body form-grid">
          <label>
            Start date
            <input
              type="date"
              value={nextStart}
              onChange={(event) => setNextStart(event.target.value)}
              required
            />
          </label>
          <label>
            End date
            <input
              type="date"
              value={nextEnd}
              onChange={(event) => setNextEnd(event.target.value)}
            />
          </label>
        </div>
        <footer className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            <X size={16} />
            Cancel
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => onSelect(nextStart, cleanText(nextEnd))}
          >
            <Save size={16} />
            Apply
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
