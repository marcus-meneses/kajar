import React, { useEffect, useMemo, useState } from "react";
import {
  Status,
  cleanText,
  fetchAllPages,
  requiredText,
  sortByNumericId,
} from "../shared";
import {
  FrameForm,
  FrameTaxForm,
  PolicySetForm,
  RuleForm,
  TaxEngineSummary,
  TaxEngineTabs,
  TaxEngineWorkspace,
} from "./components";
import type { TaxEngineTabConfig } from "./components";
import type { ApiClient, StatusState } from "../shared";
import type {
  AdministrativeState,
  City,
  Country,
  DictionaryCollection,
  DictionaryEntry,
  FiscalCategory,
  FiscalCEST,
  FiscalCFOP,
  FiscalClassTrib,
  FiscalFrame,
  FiscalFrameInput,
  FiscalFrameTax,
  FiscalFrameTaxInput,
  FiscalPolicySet,
  FiscalPolicySetInput,
  TaxRule,
  TaxRuleInput,
} from "../shared";

type TaxEngineTab = "policies" | "rules" | "frames" | "frameTaxes";
type RequestErrorHandler = (
  title: string,
  error: unknown,
  fallback: string,
) => void;
type Row = { id: string; primary: string; secondary: string };
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

const tabs: TaxEngineTabConfig[] = [
  { key: "policies", title: "Policy sets", listTitle: "Fiscal policy sets", metric: "Policies" },
  {
    key: "frames",
    title: "Fiscal frames",
    listTitle: "Fiscal frames",
    metric: "Frames",
  },
  {
    key: "frameTaxes",
    title: "Frame taxes",
    listTitle: "Fiscal frame taxes",
    metric: "Frame taxes",
  },
  { key: "rules", title: "Tax rules", listTitle: "Tax rules", metric: "Rules" },
];

const today = () => new Date().toISOString().slice(0, 10);
const toNumber = (
  value: string | number | null | undefined,
  fallback = 0,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const blankRule = (): TaxRuleInput => ({
  name: "",
  description: null,
  taxCalcMethod: "Percentage",
  taxCalcParameters: { rate: 0 },
  dateStart: today(),
  dateEnd: null,
});
const blankPolicy = (): FiscalPolicySetInput => ({
  code: "",
  name: "",
  version: 1,
  status: "Draft",
  description: null,
  dateStart: today(),
  dateEnd: null,
});
const blankFrame = (): FiscalFrameInput => ({
  policySetId: "",
  operation: "Sale",
  priority: 0,
  buyerType: null,
  version: "1",
  originCode: "0",
  jurisdiction: "Country",
  countryId: "",
  stateId: null,
  cityId: null,
  itemType: "Product",
  enterpriseSize: null,
  enterpriseType: null,
  taxRegime: null,
  fiscalNCMId: null,
  fiscalNBSId: null,
  fiscalCESTId: null,
  cstIcms: null,
  fiscalCFOPId: null,
  cstIpi: null,
  cstPis: null,
  cstCofins: null,
  CSOSN: null,
  fiscalClassTribId: null,
  dateStart: today(),
  dateEnd: null,
});
const blankFrameTax = (): FiscalFrameTaxInput => ({
  frameId: "",
  taxRuleId: "",
  taxCode: "",
  baseSource: "ItemNet",
  dependsOnTaxId: null,
  priority: 0,
  affectsInvoice: true,
  affectsPayment: false,
  phase: null,
});
export function TaxEngineEditor({
  api,
  onRequestError,
}: {
  api: ApiClient;
  onRequestError: RequestErrorHandler;
}) {
  const [tab, setTab] = useState<TaxEngineTab>("policies");
  const [policies, setPolicies] = useState<FiscalPolicySet[]>([]);
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [frames, setFrames] = useState<FiscalFrame[]>([]);
  const [frameTaxes, setFrameTaxes] = useState<FiscalFrameTax[]>([]);
  const [dictionaries, setDictionaries] = useState<DictionaryCollection>({});
  const [selected, setSelected] = useState<Record<TaxEngineTab, string | null>>(
    { policies: null, rules: null, frames: null, frameTaxes: null },
  );
  const [search, setSearch] = useState<Record<TaxEngineTab, string>>({
    policies: "",
    rules: "",
    frames: "",
    frameTaxes: "",
  });
  const [policyDraft, setPolicyDraft] = useState<FiscalPolicySetInput>(blankPolicy);
  const [ruleDraft, setRuleDraft] = useState<TaxRuleInput>(blankRule);
  const [frameDraft, setFrameDraft] = useState<FiscalFrameInput>(blankFrame);
  const [frameTaxDraft, setFrameTaxDraft] =
    useState<FiscalFrameTaxInput>(blankFrameTax);
  const [status, setStatus] = useState<StatusState>({ kind: "idle", text: "" });
  const [saving, setSaving] = useState(false);

  const ruleById = useMemo(
    () => new Map(rules.map((item) => [item.id, item])),
    [rules],
  );
  const frameById = useMemo(
    () => new Map(frames.map((item) => [item.id, item])),
    [frames],
  );
  const active = tabs.find((item) => item.key === tab)!;

  const load = async () => {
    setStatus({ kind: "loading", text: "Loading tax engine records..." });
    try {
      const [
        dictionaryResponse,
        policyRecords,
        ruleRecords,
        frameRecords,
        frameTaxRecords,
      ] = await Promise.all([
        api.listDictionaries(),
        fetchAllPages((params) => api.listFiscalPolicySets(params)),
        fetchAllPages((params) => api.listTaxRules(params)),
        fetchAllPages((params) => api.listFiscalFrames(params)),
        fetchAllPages((params) => api.listFiscalFrameTaxes(params)),
      ]);
      setDictionaries(dictionaryResponse.data);
      setPolicies(sortByNumericId(policyRecords));
      setRules(sortByNumericId(ruleRecords));
      setFrames(sortFrames(frameRecords));
      setFrameTaxes(sortByNumericId(frameTaxRecords));
      resetEditors();
      setStatus({ kind: "ok", text: "Loaded tax engine records." });
    } catch (error) {
      setStatus({ kind: "error", text: "Could not load tax engine records." });
      onRequestError(
        "Could not load tax engine records",
        error,
        "Could not load tax engine records.",
      );
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetEditors = () => {
    setSelected({
      policies: null,
      rules: null,
      frames: null,
      frameTaxes: null,
    });
    setPolicyDraft(blankPolicy());
    setRuleDraft(blankRule());
    setFrameDraft(blankFrame());
    setFrameTaxDraft(blankFrameTax());
  };
  const changeTab = (next: TaxEngineTab) => {
    setTab(next);
    resetEditors();
  };

  const selectRule = (item: TaxRule) => {
    setSelected((current) => ({ ...current, rules: item.id }));
    setRuleDraft({
      name: item.name,
      description: item.description,
      taxCalcMethod: item.taxCalcMethod,
      taxCalcParameters: item.taxCalcParameters ?? {},
      dateStart: item.dateStart,
      dateEnd: item.dateEnd,
    });
  };
  const selectPolicy = (item: FiscalPolicySet) => {
    setSelected((current) => ({ ...current, policies: item.id }));
    setPolicyDraft({
      code: item.code,
      name: item.name,
      version: item.version,
      status: item.status,
      description: item.description,
      dateStart: item.dateStart,
      dateEnd: item.dateEnd,
    });
  };
  const selectFrame = (item: FiscalFrame) => {
    setSelected((current) => ({ ...current, frames: item.id }));
    setFrameDraft({
      policySetId: item.policySetId,
      operation: item.operation,
      priority: item.priority,
      buyerType: item.buyerType,
      version: item.version,
      originCode: item.originCode,
      jurisdiction: item.jurisdiction,
      countryId: item.countryId,
      stateId: item.stateId,
      cityId: item.cityId,
      itemType: item.itemType,
      enterpriseSize: item.enterpriseSize,
      enterpriseType: item.enterpriseType,
      taxRegime: item.taxRegime,
      fiscalNCMId: item.fiscalNCMId,
      fiscalNBSId: item.fiscalNBSId,
      fiscalCESTId: item.fiscalCESTId,
      cstIcms: item.cstIcms,
      fiscalCFOPId: item.fiscalCFOPId,
      cstIpi: item.cstIpi,
      cstPis: item.cstPis,
      cstCofins: item.cstCofins,
      CSOSN: item.CSOSN,
      fiscalClassTribId: item.fiscalClassTribId,
      dateStart: item.dateStart,
      dateEnd: item.dateEnd,
    });
  };
  const selectFrameTax = (item: FiscalFrameTax) => {
    setSelected((current) => ({ ...current, frameTaxes: item.id }));
    setFrameTaxDraft({
      frameId: item.frameId,
      taxRuleId: item.taxRuleId,
      taxCode: item.taxCode,
      baseSource: item.baseSource,
      dependsOnTaxId: item.dependsOnTaxId,
      priority: item.priority,
      affectsInvoice: item.affectsInvoice,
      affectsPayment: item.affectsPayment,
      phase: item.phase,
    });
  };
  const savePolicy = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const input: FiscalPolicySetInput = {
        ...policyDraft,
        code: requiredText(policyDraft.code),
        name: requiredText(policyDraft.name),
        version: toNumber(policyDraft.version, 1),
        description: cleanText(policyDraft.description),
        dateEnd: cleanText(policyDraft.dateEnd),
      };
      const selectedId = selected.policies;
      const response = selectedId
        ? await api.updateFiscalPolicySet(selectedId, input)
        : await api.createFiscalPolicySet(input);
      setPolicies(sortByNumericId(selectedId
        ? policies.map((item) => item.id === selectedId ? response.data : item)
        : [...policies, response.data]));
      selectPolicy(response.data);
      setStatus({ kind: "ok", text: selectedId ? "Policy set updated." : "Policy set created." });
    } catch (error) {
      onRequestError("Could not save policy set", error, "Could not save policy set.");
    } finally {
      setSaving(false);
    }
  };

  const saveRule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const input: TaxRuleInput = {
        name: requiredText(ruleDraft.name),
        description: cleanText(ruleDraft.description),
        taxCalcMethod: ruleDraft.taxCalcMethod,
        taxCalcParameters: ruleDraft.taxCalcParameters,
        dateStart: ruleDraft.dateStart,
        dateEnd: cleanText(ruleDraft.dateEnd),
      };
      const selectedId = selected.rules;
      const response = selectedId
        ? await api.updateTaxRule(selectedId, input)
        : await api.createTaxRule(input);
      setRules(
        sortByNumericId(
          selectedId
            ? rules.map((item) =>
                item.id === selectedId ? response.data : item,
              )
            : [...rules, response.data],
        ),
      );
      selectRule(response.data);
      setStatus({
        kind: "ok",
        text: selectedId ? "Tax rule updated." : "Tax rule created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save tax rule",
        error,
        "Could not save tax rule. Check that parameters contain valid JSON.",
      );
    } finally {
      setSaving(false);
    }
  };
  const saveFrame = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const input = normalizeFrame(frameDraft);
      const selectedId = selected.frames;
      const response = selectedId
        ? await api.updateFiscalFrame(selectedId, input)
        : await api.createFiscalFrame(input);
      setFrames(
        sortFrames(
          selectedId
            ? frames.map((item) =>
                item.id === selectedId ? response.data : item,
              )
            : [...frames, response.data],
        ),
      );
      selectFrame(response.data);
      setStatus({
        kind: "ok",
        text: selectedId ? "Fiscal frame updated." : "Fiscal frame created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save fiscal frame",
        error,
        "Could not save fiscal frame.",
      );
    } finally {
      setSaving(false);
    }
  };
  const saveFrameTax = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const input: FiscalFrameTaxInput = {
        ...frameTaxDraft,
        taxCode: requiredText(frameTaxDraft.taxCode),
        priority: toNumber(frameTaxDraft.priority),
        dependsOnTaxId: cleanText(frameTaxDraft.dependsOnTaxId),
        phase: cleanText(frameTaxDraft.phase) as FiscalFrameTaxInput["phase"],
      };
      const selectedId = selected.frameTaxes;
      const response = selectedId
        ? await api.updateFiscalFrameTax(selectedId, input)
        : await api.createFiscalFrameTax(input);
      setFrameTaxes(
        sortByNumericId(
          selectedId
            ? frameTaxes.map((item) =>
                item.id === selectedId ? response.data : item,
              )
            : [...frameTaxes, response.data],
        ),
      );
      selectFrameTax(response.data);
      setStatus({
        kind: "ok",
        text: selectedId ? "Frame tax updated." : "Frame tax created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save frame tax",
        error,
        "Could not save frame tax.",
      );
    } finally {
      setSaving(false);
    }
  };
  const deleteCurrent = async () => {
    const selectedId = selected[tab];
    if (
      !selectedId ||
      !window.confirm(
        "Delete selected " + active.title.toLowerCase() + " record?",
      )
    )
      return;
    setSaving(true);
    try {
      if (tab === "policies") {
        await api.deleteFiscalPolicySet(selectedId);
        setPolicies(policies.filter((item) => item.id !== selectedId));
      }
      if (tab === "rules") {
        await api.deleteTaxRule(selectedId);
        setRules(rules.filter((item) => item.id !== selectedId));
      }
      if (tab === "frames") {
        await api.deleteFiscalFrame(selectedId);
        setFrames(frames.filter((item) => item.id !== selectedId));
      }
      if (tab === "frameTaxes") {
        await api.deleteFiscalFrameTax(selectedId);
        setFrameTaxes(frameTaxes.filter((item) => item.id !== selectedId));
      }
      resetEditors();
      setStatus({ kind: "ok", text: active.title + " deleted." });
    } catch (error) {
      onRequestError(
        "Could not delete " + active.title,
        error,
        "Could not delete tax engine record.",
      );
    } finally {
      setSaving(false);
    }
  };

  const rows =
    tab === "policies"
      ? filterRows(policyRows(policies), search.policies)
      : tab === "rules"
      ? filterRows(ruleRows(rules), search.rules)
      : tab === "frames"
        ? filterRows(frameRows(frames), search.frames)
        : filterRows(
            frameTaxRows(frameTaxes, frameById, ruleById),
            search.frameTaxes,
          );

  return (
    <>
      <TaxEngineSummary
        policies={policies.length}
        rules={rules.length}
        frames={frames.length}
        frameTaxes={frameTaxes.length}
        onRefresh={() => void load()}
      />
      <Status status={status} />
      <TaxEngineTabs tabs={tabs} active={tab} onChange={changeTab} />
      <TaxEngineWorkspace
        title={active.listTitle}
        search={search[tab]}
        onSearchChange={(value) => setSearch({ ...search, [tab]: value })}
        rows={rows}
        selectedId={selected[tab]}
        onSelect={(id) => {
          if (tab === "policies")
            selectPolicy(policies.find((item) => item.id === id)!);
          if (tab === "rules")
            selectRule(rules.find((item) => item.id === id)!);
          if (tab === "frames")
            selectFrame(frames.find((item) => item.id === id)!);
          if (tab === "frameTaxes")
            selectFrameTax(frameTaxes.find((item) => item.id === id)!);
        }}
      >
        {tab === "policies" ? (
          <PolicySetForm
            draft={policyDraft}
            selectedId={selected.policies}
            saving={saving}
            onDraft={setPolicyDraft}
            onSubmit={savePolicy}
            onNew={() => {
              setSelected((current) => ({ ...current, policies: null }));
              setPolicyDraft(blankPolicy());
            }}
            onDelete={deleteCurrent}
          />
        ) : tab === "rules" ? (
          <RuleForm
            draft={ruleDraft}
            selectedId={selected.rules}
            saving={saving}
            onDraft={setRuleDraft}
            onSubmit={saveRule}
            onNew={() => {
              setSelected((current) => ({ ...current, rules: null }));
              setRuleDraft(blankRule());
            }}
            onDelete={deleteCurrent}
          />
        ) : tab === "frames" ? (
          <FrameForm
            api={api}
            draft={frameDraft}
            selectedId={selected.frames}
            saving={saving}
            dictionaries={dictionaries}
            policySets={policies}
            onDraft={setFrameDraft}
            onSubmit={saveFrame}
            onRequestError={onRequestError}
            onNew={() => {
              setSelected((current) => ({ ...current, frames: null }));
              setFrameDraft(blankFrame());
            }}
            onDelete={deleteCurrent}
          />
        ) : (
          <FrameTaxForm
            draft={frameTaxDraft}
            selectedId={selected.frameTaxes}
            saving={saving}
            frames={frames}
            rules={rules}
            frameTaxes={frameTaxes}
            onDraft={setFrameTaxDraft}
            onSubmit={saveFrameTax}
            onNew={() => {
              setSelected((current) => ({ ...current, frameTaxes: null }));
              setFrameTaxDraft(blankFrameTax());
            }}
            onDelete={deleteCurrent}
          />
        )}
      </TaxEngineWorkspace>
    </>
  );
}

function normalizeFrame(frame: FiscalFrameInput): FiscalFrameInput {
  return {
    ...frame,
    policySetId: requiredText(frame.policySetId),
    priority: toNumber(frame.priority),
    buyerType: cleanText(frame.buyerType) as FiscalFrameInput["buyerType"],
    version: requiredText(frame.version),
    originCode: requiredText(frame.originCode),
    countryId: requiredText(frame.countryId),
    stateId: cleanText(frame.stateId),
    cityId: cleanText(frame.cityId),
    enterpriseSize: cleanText(frame.enterpriseSize),
    enterpriseType: cleanText(frame.enterpriseType),
    taxRegime: cleanText(frame.taxRegime),
    fiscalNCMId: cleanText(frame.fiscalNCMId),
    fiscalNBSId: cleanText(frame.fiscalNBSId),
    fiscalCESTId: cleanText(frame.fiscalCESTId),
    cstIcms: cleanText(frame.cstIcms),
    fiscalCFOPId: cleanText(frame.fiscalCFOPId),
    cstIpi: cleanText(frame.cstIpi),
    cstPis: cleanText(frame.cstPis),
    cstCofins: cleanText(frame.cstCofins),
    CSOSN: cleanText(frame.CSOSN),
    fiscalClassTribId: cleanText(frame.fiscalClassTribId),
    dateEnd: cleanText(frame.dateEnd),
  };
}
function policyRows(items: FiscalPolicySet[]): Row[] {
  return items.map((item) => ({
    id: item.id,
    primary: item.code + " v" + item.version + " - " + item.name,
    secondary: [item.status, item.dateStart, item.dateEnd].filter(Boolean).join(" / "),
  }));
}
function sortFrames(items: FiscalFrame[]): FiscalFrame[] {
  return [...items].sort(
    (left, right) =>
      left.version.localeCompare(right.version) ||
      left.countryId.localeCompare(right.countryId) ||
      Number(left.numericId) - Number(right.numericId),
  );
}
function filterRows(rows: Row[], query: string): Row[] {
  const needle = query.trim().toLowerCase();
  return needle
    ? rows.filter((row) =>
        (row.primary + " " + row.secondary).toLowerCase().includes(needle),
      )
    : rows;
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
function ruleRows(items: TaxRule[]): Row[] {
  return items.map((item) => ({
    id: item.id,
    primary: ruleLabel(item),
    secondary: [
      item.description,
      item.taxCalcMethod,
      item.dateStart,
      item.dateEnd,
      JSON.stringify(item.taxCalcParameters),
    ]
      .filter(Boolean)
      .join(" / "),
  }));
}
function frameRows(items: FiscalFrame[]): Row[] {
  return items.map((item) => ({
    id: item.id,
    primary: frameLabel(item),
    secondary: [
      item.originCode,
      item.jurisdiction,
      item.fiscalNCMId,
      item.fiscalCFOPId,
      item.dateStart,
    ]
      .filter(Boolean)
      .join(" / "),
  }));
}
function frameTaxRows(
  items: FiscalFrameTax[],
  frameById: Map<string, FiscalFrame>,
  ruleById: Map<string, TaxRule>,
): Row[] {
  return items.map((item) => ({
    id: item.id,
    primary: frameTaxLabel(item),
    secondary: [
      frameById.get(item.frameId)
        ? frameLabel(frameById.get(item.frameId)!)
        : item.frameId,
      ruleById.get(item.taxRuleId)
        ? ruleLabel(ruleById.get(item.taxRuleId)!)
        : item.taxRuleId,
      item.baseSource,
      item.phase,
    ]
      .filter(Boolean)
      .join(" / "),
  }));
}
function dictionaryValue(entry: DictionaryEntry): string {
  return String(entry.abbreviation ?? entry.acronym ?? entry.index ?? "");
}
function dictionaryOptionLabel(entry: DictionaryEntry): string {
  return dictionaryValue(entry) + " - " + entry.description;
}
function mergeMap<T extends { id: string }>(
  current: Map<string, T>,
  records: T[],
): Map<string, T> {
  const next = new Map(current);
  for (const record of records) next.set(record.id, record);
  return next;
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
function sortFiscalCFOPs(items: FiscalCFOP[]): FiscalCFOP[] {
  return [...items].sort((left, right) => left.code.localeCompare(right.code));
}
