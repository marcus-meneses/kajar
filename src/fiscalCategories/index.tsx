import React, { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import {
  Metric,
  Status,
  RecordList,
  cleanText,
  fetchAllPages,
  requiredText,
  sortByCode,
} from "../shared";
import {
  CategoryForm,
  CESTForm,
  CFOPForm,
  ClassTribForm,
  IPIForm,
  ISSQNForm,
  ParentPickerModal,
  TreeList,
} from "./components";
import type { ApiClient } from "../shared";
import type {
  FiscalCategory,
  FiscalCategoryInput,
  FiscalCEST,
  FiscalCESTInput,
  FiscalCFOP,
  FiscalCFOPInput,
  FiscalClassTrib,
  FiscalClassTribInput,
  FiscalIPIFrame,
  FiscalIPIFrameInput,
  FiscalISSQNFrame,
  FiscalISSQNFrameInput,
} from "../shared";

type FiscalTab =
  | "cnae"
  | "ncm"
  | "nbs"
  | "cfop"
  | "cest"
  | "classtrib"
  | "ipi"
  | "issqn";
type CategoryTab = "cnae" | "ncm" | "nbs";
type StatusState = { kind: "idle" | "ok" | "error" | "loading"; text: string };
type RequestErrorHandler = (
  title: string,
  error: unknown,
  fallback: string,
) => void;
type FrameDraft = FiscalIPIFrameInput;
type CfopDraft = FiscalCFOPInput;
type CestDraft = FiscalCESTInput;
type ClassTribDraft = FiscalClassTribInput;
type IssqnDraft = FiscalISSQNFrameInput;
type TreeRow = {
  id: string;
  primary: string;
  secondary: string;
  depth: number;
};
type ParentPickerState = { key: CategoryTab; title: string } | null;

type TabConfig = {
  key: FiscalTab;
  title: string;
  listTitle: string;
  metric: string;
};
const tabs: TabConfig[] = [
  { key: "cnae", title: "CNAE", listTitle: "Fiscal CNAE", metric: "CNAE" },
  { key: "ncm", title: "NCM", listTitle: "Fiscal NCM", metric: "NCM" },
  { key: "nbs", title: "NBS", listTitle: "Fiscal NBS", metric: "NBS" },
  { key: "cfop", title: "CFOP", listTitle: "Fiscal CFOP", metric: "CFOP" },
  { key: "cest", title: "CEST", listTitle: "Fiscal CEST", metric: "CEST" },
  {
    key: "classtrib",
    title: "ClassTrib",
    listTitle: "Fiscal ClassTrib",
    metric: "ClassTrib",
  },
  {
    key: "ipi",
    title: "IPI frames",
    listTitle: "Fiscal IPI frames",
    metric: "IPI",
  },
  {
    key: "issqn",
    title: "ISSQN frames",
    listTitle: "Fiscal ISSQN frames",
    metric: "ISSQN",
  },
];

const categoryTabs = new Set<FiscalTab>(["cnae", "ncm", "nbs"]);
const blankCategory = (): FiscalCategoryInput => ({
  parent: null,
  code: "",
  description: "",
});
const blankIPI = (): FrameDraft => ({ code: "", group: "", description: "" });
const blankCFOP = (): CfopDraft => ({ code: "", description: "" });
const blankCEST = (): CestDraft => ({
  item: null,
  code: "",
  ncm: null,
  description: "",
  segment: null,
  source: "CONFAZ Convênio ICMS 142/18",
});
const blankClassTrib = (): ClassTribDraft => ({
  cstCode: "",
  cstDescription: "",
  code: "",
  name: "",
  description: "",
  legalText: null,
  lc214: null,
  regulationCBS: null,
  regulationIBS: null,
  rateType: null,
  pRedIBS: null,
  pRedCBS: null,
  tpRBSN: null,
  dateStart: null,
  dateEnd: null,
  sourceUpdatedAt: null,
  annex: null,
  link: null,
  source: "SVRS cClassTrib",
});
const blankISSQN = (): IssqnDraft => ({ code: "", description: "" });

export function FiscalCategoriesEditor({
  api,
  onRequestError,
}: {
  api: ApiClient;
  onRequestError: RequestErrorHandler;
}) {
  const [tab, setTab] = useState<FiscalTab>("cnae");
  const [cnaes, setCnaes] = useState<FiscalCategory[]>([]);
  const [ncms, setNcms] = useState<FiscalCategory[]>([]);
  const [nbs, setNbs] = useState<FiscalCategory[]>([]);
  const [parentCategoryRecords, setParentCategoryRecords] = useState<
    Record<CategoryTab, FiscalCategory[]>
  >({ cnae: [], ncm: [], nbs: [] });
  const [ipis, setIpis] = useState<FiscalIPIFrame[]>([]);
  const [cfops, setCfops] = useState<FiscalCFOP[]>([]);
  const [cests, setCests] = useState<FiscalCEST[]>([]);
  const [classTribs, setClassTribs] = useState<FiscalClassTrib[]>([]);
  const [issqns, setIssqns] = useState<FiscalISSQNFrame[]>([]);
  const [counts, setCounts] = useState<Record<FiscalTab, number>>({
    cnae: 0,
    ncm: 0,
    nbs: 0,
    cfop: 0,
    cest: 0,
    classtrib: 0,
    ipi: 0,
    issqn: 0,
  });
  const [selected, setSelected] = useState<Record<FiscalTab, string | null>>({
    cnae: null,
    ncm: null,
    nbs: null,
    cfop: null,
    cest: null,
    classtrib: null,
    ipi: null,
    issqn: null,
  });
  const [expanded, setExpanded] = useState<Record<CategoryTab, string[]>>({
    cnae: [],
    ncm: [],
    nbs: [],
  });
  const [loadedChildren, setLoadedChildren] = useState<
    Record<CategoryTab, string[]>
  >({ cnae: [], ncm: [], nbs: [] });
  const [loadingChildren, setLoadingChildren] = useState<
    Record<CategoryTab, string[]>
  >({ cnae: [], ncm: [], nbs: [] });
  const [parentExpanded, setParentExpanded] = useState<
    Record<CategoryTab, string[]>
  >({ cnae: [], ncm: [], nbs: [] });
  const [parentLoadedChildren, setParentLoadedChildren] = useState<
    Record<CategoryTab, string[]>
  >({ cnae: [], ncm: [], nbs: [] });
  const [parentLoadingChildren, setParentLoadingChildren] = useState<
    Record<CategoryTab, string[]>
  >({ cnae: [], ncm: [], nbs: [] });
  const [categoryDraft, setCategoryDraft] =
    useState<FiscalCategoryInput>(blankCategory);
  const [ipiDraft, setIpiDraft] = useState<FrameDraft>(blankIPI);
  const [cfopDraft, setCfopDraft] = useState<CfopDraft>(blankCFOP);
  const [cestDraft, setCestDraft] = useState<CestDraft>(blankCEST);
  const [classTribDraft, setClassTribDraft] =
    useState<ClassTribDraft>(blankClassTrib);
  const [issqnDraft, setIssqnDraft] = useState<IssqnDraft>(blankISSQN);
  const [search, setSearch] = useState<Record<FiscalTab, string>>({
    cnae: "",
    ncm: "",
    nbs: "",
    cfop: "",
    cest: "",
    classtrib: "",
    ipi: "",
    issqn: "",
  });
  const [parentSearch, setParentSearch] = useState<Record<CategoryTab, string>>(
    { cnae: "", ncm: "", nbs: "" },
  );
  const [status, setStatus] = useState<StatusState>({ kind: "idle", text: "" });
  const [saving, setSaving] = useState(false);
  const [parentPicker, setParentPicker] = useState<ParentPickerState>(null);

  const activeConfig = tabs.find((item) => item.key === tab)!;
  const cnaeById = useMemo(
    () => new Map(cnaes.map((item) => [item.id, item])),
    [cnaes],
  );
  const ncmById = useMemo(
    () => new Map(ncms.map((item) => [item.id, item])),
    [ncms],
  );
  const nbsById = useMemo(
    () => new Map(nbs.map((item) => [item.id, item])),
    [nbs],
  );
  const sortCategory = (items: FiscalCategory[]) =>
    [...items].sort((left, right) => left.code.localeCompare(right.code));
  const sortFrames = sortByCode;
  const currentCategories = tab === "cnae" ? cnaes : tab === "ncm" ? ncms : nbs;
  const currentCategoryById =
    tab === "cnae" ? cnaeById : tab === "ncm" ? ncmById : nbsById;
  const recordsForKey = (key: CategoryTab) =>
    key === "cnae" ? cnaes : key === "ncm" ? ncms : nbs;

  const load = async () => {
    setStatus({ kind: "loading", text: "Loading fiscal categories..." });
    try {
      const [
        cnaeCount,
        ncmCount,
        nbsCount,
        cfopCount,
        cestCount,
        classTribCount,
        ipiCount,
        issqnCount,
        cnaeRoots,
        ncmRoots,
        nbsRoots,
        cfopRecords,
        cestRecords,
        classTribRecords,
        ipiRecords,
        issqnRecords,
      ] = await Promise.all([
        api.countFiscalCNAEs(),
        api.countFiscalNCMs(),
        api.countFiscalNBS(),
        api.countFiscalCFOPs(),
        api.countFiscalCESTs(),
        api.countFiscalClassTribs(),
        api.countFiscalIPIFrames(),
        api.countFiscalISSQNFrames(),
        fetchAllPages((params) => api.listFiscalCNAERoots(params)),
        fetchAllPages((params) => api.listFiscalNCMRoots(params)),
        fetchAllPages((params) => api.listFiscalNBSRoots(params)),
        fetchAllPages((params) => api.listFiscalCFOPs(params)),
        fetchAllPages((params) => api.listFiscalCESTs(params)),
        fetchAllPages((params) => api.listFiscalClassTribs(params)),
        fetchAllPages((params) => api.listFiscalIPIFrames(params)),
        fetchAllPages((params) => api.listFiscalISSQNFrames(params)),
      ]);
      setCounts({
        cnae: cnaeCount.count,
        ncm: ncmCount.count,
        nbs: nbsCount.count,
        cfop: cfopCount.count,
        cest: cestCount.count,
        classtrib: classTribCount.count,
        ipi: ipiCount.count,
        issqn: issqnCount.count,
      });
      setCnaes(sortCategory(cnaeRoots));
      setNcms(sortCategory(ncmRoots));
      setNbs(sortCategory(nbsRoots));
      setParentCategoryRecords({
        cnae: sortCategory(cnaeRoots),
        ncm: sortCategory(ncmRoots),
        nbs: sortCategory(nbsRoots),
      });
      setCfops(sortFrames(cfopRecords));
      setCests(sortFrames(cestRecords));
      setClassTribs(sortFrames(classTribRecords));
      setIpis(sortFrames(ipiRecords));
      setIssqns(sortFrames(issqnRecords));
      setExpanded({ cnae: [], ncm: [], nbs: [] });
      setLoadedChildren({ cnae: [], ncm: [], nbs: [] });
      setLoadingChildren({ cnae: [], ncm: [], nbs: [] });
      setParentExpanded({ cnae: [], ncm: [], nbs: [] });
      setParentLoadedChildren({ cnae: [], ncm: [], nbs: [] });
      setParentLoadingChildren({ cnae: [], ncm: [], nbs: [] });
      setParentSearch({ cnae: "", ncm: "", nbs: "" });
      resetEditors();
      setStatus({
        kind: "ok",
        text: "Loaded fiscal category roots and frame records.",
      });
    } catch (error) {
      setStatus({ kind: "error", text: "Could not load fiscal categories." });
      onRequestError(
        "Could not load fiscal categories",
        error,
        "Could not load fiscal categories.",
      );
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetEditors = () => {
    setSelected({
      cnae: null,
      ncm: null,
      nbs: null,
      cfop: null,
      cest: null,
      classtrib: null,
      ipi: null,
      issqn: null,
    });
    setCategoryDraft(blankCategory());
    setCfopDraft(blankCFOP());
    setCestDraft(blankCEST());
    setClassTribDraft(blankClassTrib());
    setIpiDraft(blankIPI());
    setIssqnDraft(blankISSQN());
  };
  const changeTab = (next: FiscalTab) => {
    setTab(next);
    resetEditors();
  };
  const setCategoryRecords = (
    key: CategoryTab,
    updater: (items: FiscalCategory[]) => FiscalCategory[],
  ) => {
    if (key === "cnae") setCnaes((items) => updater(items));
    if (key === "ncm") setNcms((items) => updater(items));
    if (key === "nbs") setNbs((items) => updater(items));
  };
  const setParentRecords = (
    key: CategoryTab,
    updater: (items: FiscalCategory[]) => FiscalCategory[],
  ) =>
    setParentCategoryRecords((current) => ({
      ...current,
      [key]: updater(current[key]),
    }));
  const categoryApi = (key: CategoryTab) =>
    key === "cnae"
      ? {
          children: api.listFiscalCNAEChildren.bind(api),
          create: api.createFiscalCNAE.bind(api),
          update: api.updateFiscalCNAE.bind(api),
          delete: api.deleteFiscalCNAE.bind(api),
        }
      : key === "ncm"
        ? {
            children: api.listFiscalNCMChildren.bind(api),
            create: api.createFiscalNCM.bind(api),
            update: api.updateFiscalNCM.bind(api),
            delete: api.deleteFiscalNCM.bind(api),
          }
        : {
            children: api.listFiscalNBSChildren.bind(api),
            create: api.createFiscalNBS.bind(api),
            update: api.updateFiscalNBS.bind(api),
            delete: api.deleteFiscalNBS.bind(api),
          };

  const selectCategory = (item: FiscalCategory) => {
    setSelected((current) => ({ ...current, [tab]: item.id }));
    setCategoryDraft({
      parent: item.parent,
      code: item.code,
      description: item.description,
    });
  };
  const selectCFOP = (item: FiscalCFOP) => {
    setSelected((current) => ({ ...current, cfop: item.id }));
    setCfopDraft({ code: item.code, description: item.description });
  };
  const selectCEST = (item: FiscalCEST) => {
    setSelected((current) => ({ ...current, cest: item.id }));
    setCestDraft({
      item: item.item,
      code: item.code,
      ncm: item.ncm,
      description: item.description,
      segment: item.segment,
      source: item.source,
    });
  };
  const selectClassTrib = (item: FiscalClassTrib) => {
    setSelected((current) => ({ ...current, classtrib: item.id }));
    setClassTribDraft({
      cstCode: item.cstCode,
      cstDescription: item.cstDescription,
      code: item.code,
      name: item.name,
      description: item.description,
      legalText: item.legalText,
      lc214: item.lc214,
      regulationCBS: item.regulationCBS,
      regulationIBS: item.regulationIBS,
      rateType: item.rateType,
      pRedIBS: item.pRedIBS,
      pRedCBS: item.pRedCBS,
      tpRBSN: item.tpRBSN,
      dateStart: item.dateStart,
      dateEnd: item.dateEnd,
      sourceUpdatedAt: item.sourceUpdatedAt,
      annex: item.annex,
      link: item.link,
      source: item.source,
    });
  };
  const selectIPI = (item: FiscalIPIFrame) => {
    setSelected((current) => ({ ...current, ipi: item.id }));
    setIpiDraft({
      code: String(item.code),
      group: item.group,
      description: item.description,
    });
  };
  const selectISSQN = (item: FiscalISSQNFrame) => {
    setSelected((current) => ({ ...current, issqn: item.id }));
    setIssqnDraft({ code: String(item.code), description: item.description });
  };

  const toggleCategory = async (key: CategoryTab, id: string) => {
    const isOpen = expanded[key].includes(id);
    if (isOpen) {
      setExpanded((current) => ({
        ...current,
        [key]: current[key].filter((item) => item !== id),
      }));
      return;
    }
    setExpanded((current) => ({ ...current, [key]: [...current[key], id] }));
    if (loadedChildren[key].includes(id) || loadingChildren[key].includes(id))
      return;
    setLoadingChildren((current) => ({
      ...current,
      [key]: [...current[key], id],
    }));
    try {
      const children = await fetchAllPages((params) =>
        categoryApi(key).children(id, params),
      );
      setCategoryRecords(key, (items) =>
        sortCategory([
          ...items.filter(
            (item) => !children.some((child) => child.id === item.id),
          ),
          ...children,
        ]),
      );
      setLoadedChildren((current) => ({
        ...current,
        [key]: [...current[key], id],
      }));
    } catch (error) {
      onRequestError(
        "Could not load child fiscal categories",
        error,
        "Could not load child fiscal categories.",
      );
    } finally {
      setLoadingChildren((current) => ({
        ...current,
        [key]: current[key].filter((item) => item !== id),
      }));
    }
  };

  const toggleParentCategory = async (key: CategoryTab, id: string) => {
    const isOpen = parentExpanded[key].includes(id);
    if (isOpen) {
      setParentExpanded((current) => ({
        ...current,
        [key]: current[key].filter((item) => item !== id),
      }));
      return;
    }
    setParentExpanded((current) => ({
      ...current,
      [key]: [...current[key], id],
    }));
    if (
      parentLoadedChildren[key].includes(id) ||
      parentLoadingChildren[key].includes(id)
    )
      return;
    setParentLoadingChildren((current) => ({
      ...current,
      [key]: [...current[key], id],
    }));
    try {
      const children = await fetchAllPages((params) =>
        categoryApi(key).children(id, params),
      );
      setParentRecords(key, (items) =>
        sortCategory([
          ...items.filter(
            (item) => !children.some((child) => child.id === item.id),
          ),
          ...children,
        ]),
      );
      setParentLoadedChildren((current) => ({
        ...current,
        [key]: [...current[key], id],
      }));
    } catch (error) {
      onRequestError(
        "Could not load child fiscal categories",
        error,
        "Could not load child fiscal categories.",
      );
    } finally {
      setParentLoadingChildren((current) => ({
        ...current,
        [key]: current[key].filter((item) => item !== id),
      }));
    }
  };

  const openParentPicker = (key: CategoryTab, title: string) => {
    const records = mergeFiscalCategories(
      parentCategoryRecords[key],
      recordsForKey(key),
    );
    const ancestorIds = categoryDraft.parent
      ? collectAncestorIds(records, categoryDraft.parent)
      : [];
    setParentRecords(key, () => records);
    setParentExpanded((current) => ({
      ...current,
      [key]: mergeIds(current[key], ancestorIds),
    }));
    setParentSearch((current) => ({ ...current, [key]: "" }));
    setParentPicker({ key, title });
  };

  const buildTreeRows = (
    items: FiscalCategory[],
    key: CategoryTab,
    query: string,
    excludedIds: string[] = [],
    expandedIds = expanded[key],
  ): TreeRow[] => {
    const needle = query.trim().toLowerCase();
    const excluded = new Set(excludedIds);
    const children = new Map<string, FiscalCategory[]>();
    for (const item of items) {
      const parent = item.parent ?? "";
      children.set(parent, [...(children.get(parent) ?? []), item]);
    }
    for (const list of children.values())
      list.sort((left, right) => left.code.localeCompare(right.code));
    const rows: TreeRow[] = [];
    const visit = (item: FiscalCategory, depth: number) => {
      const matches =
        !needle ||
        [item.code, item.description].some((value) =>
          value.toLowerCase().includes(needle),
        );
      if (matches && !excluded.has(item.id))
        rows.push({
          id: item.id,
          primary: item.code,
          secondary: item.description,
          depth,
        });
      if ((needle || expandedIds.includes(item.id)) && children.has(item.id))
        for (const child of children.get(item.id) ?? [])
          visit(child, depth + 1);
    };
    for (const root of children.get("") ?? []) visit(root, 0);
    return rows;
  };
  const frameRows = <
    T extends { id: string; code: string | number; description: string | null },
  >(
    items: T[],
    query: string,
  ) => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? items.filter((item) =>
          [String(item.code), item.description].some((value) =>
            value?.toLowerCase().includes(needle),
          ),
        )
      : items;
    return filtered.map((item) => ({
      id: item.id,
      primary: String(item.code),
      secondary: item.description ?? item.id,
    }));
  };

  const saveCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryTabs.has(tab)) return;
    const key = tab as CategoryTab;
    const selectedId = selected[key];
    const input: FiscalCategoryInput = {
      parent: categoryDraft.parent || null,
      code: requiredText(categoryDraft.code),
      description: requiredText(categoryDraft.description),
    };
    setSaving(true);
    try {
      const response = selectedId
        ? await categoryApi(key).update(selectedId, input)
        : await categoryApi(key).create(input);
      setCategoryRecords(key, (items) =>
        sortCategory(
          selectedId
            ? items.map((item) =>
                item.id === selectedId ? response.data : item,
              )
            : [...items, response.data],
        ),
      );
      setParentRecords(key, (items) =>
        sortCategory(
          selectedId
            ? items.map((item) =>
                item.id === selectedId ? response.data : item,
              )
            : [...items, response.data],
        ),
      );
      if (!selectedId)
        setCounts((current) => ({ ...current, [key]: current[key] + 1 }));
      setSelected((current) => ({ ...current, [key]: response.data.id }));
      setCategoryDraft({
        parent: response.data.parent,
        code: response.data.code,
        description: response.data.description,
      });
      setStatus({
        kind: "ok",
        text: activeConfig.title + (selectedId ? " updated." : " created."),
      });
    } catch (error) {
      onRequestError(
        "Could not save " + activeConfig.title,
        error,
        "Could not save fiscal category.",
      );
    } finally {
      setSaving(false);
    }
  };
  const saveCFOP = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: CfopDraft = {
      code: requiredText(cfopDraft.code),
      description: requiredText(cfopDraft.description),
    };
    setSaving(true);
    try {
      const selectedId = selected.cfop;
      const response = selectedId
        ? await api.updateFiscalCFOP(selectedId, input)
        : await api.createFiscalCFOP(input);
      setCfops(
        sortFrames(
          selectedId
            ? cfops.map((item) =>
                item.id === selectedId ? response.data : item,
              )
            : [...cfops, response.data],
        ),
      );
      if (!selectedId)
        setCounts((current) => ({ ...current, cfop: current.cfop + 1 }));
      setSelected((current) => ({ ...current, cfop: response.data.id }));
      selectCFOP(response.data);
      setStatus({
        kind: "ok",
        text: selectedId ? "CFOP updated." : "CFOP created.",
      });
    } catch (error) {
      onRequestError("Could not save CFOP", error, "Could not save CFOP.");
    } finally {
      setSaving(false);
    }
  };
  const saveCEST = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: CestDraft = {
      item: cleanText(cestDraft.item),
      code: requiredText(cestDraft.code),
      ncm: cleanText(cestDraft.ncm),
      description: requiredText(cestDraft.description),
      segment: cleanText(cestDraft.segment),
      source: requiredText(cestDraft.source),
    };
    setSaving(true);
    try {
      const selectedId = selected.cest;
      const response = selectedId
        ? await api.updateFiscalCEST(selectedId, input)
        : await api.createFiscalCEST(input);
      setCests(
        sortFrames(
          selectedId
            ? cests.map((item) =>
                item.id === selectedId ? response.data : item,
              )
            : [...cests, response.data],
        ),
      );
      if (!selectedId)
        setCounts((current) => ({ ...current, cest: current.cest + 1 }));
      setSelected((current) => ({ ...current, cest: response.data.id }));
      selectCEST(response.data);
      setStatus({
        kind: "ok",
        text: selectedId ? "CEST updated." : "CEST created.",
      });
    } catch (error) {
      onRequestError("Could not save CEST", error, "Could not save CEST.");
    } finally {
      setSaving(false);
    }
  };
  const saveClassTrib = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: ClassTribDraft = {
      ...classTribDraft,
      cstCode: requiredText(classTribDraft.cstCode),
      cstDescription: requiredText(classTribDraft.cstDescription),
      code: requiredText(classTribDraft.code),
      name: requiredText(classTribDraft.name),
      description: requiredText(classTribDraft.description),
      legalText: cleanText(classTribDraft.legalText),
      lc214: cleanText(classTribDraft.lc214),
      regulationCBS: cleanText(classTribDraft.regulationCBS),
      regulationIBS: cleanText(classTribDraft.regulationIBS),
      rateType: cleanText(classTribDraft.rateType),
      pRedIBS: nullableNumber(classTribDraft.pRedIBS),
      pRedCBS: nullableNumber(classTribDraft.pRedCBS),
      tpRBSN: cleanText(classTribDraft.tpRBSN),
      dateStart: cleanText(classTribDraft.dateStart),
      dateEnd: cleanText(classTribDraft.dateEnd),
      sourceUpdatedAt: cleanText(classTribDraft.sourceUpdatedAt),
      annex: cleanText(classTribDraft.annex),
      link: cleanText(classTribDraft.link),
      source: requiredText(classTribDraft.source),
    };
    setSaving(true);
    try {
      const selectedId = selected.classtrib;
      const response = selectedId
        ? await api.updateFiscalClassTrib(selectedId, input)
        : await api.createFiscalClassTrib(input);
      setClassTribs(
        sortFrames(
          selectedId
            ? classTribs.map((item) =>
                item.id === selectedId ? response.data : item,
              )
            : [...classTribs, response.data],
        ),
      );
      if (!selectedId)
        setCounts((current) => ({
          ...current,
          classtrib: current.classtrib + 1,
        }));
      setSelected((current) => ({ ...current, classtrib: response.data.id }));
      selectClassTrib(response.data);
      setStatus({
        kind: "ok",
        text: selectedId ? "ClassTrib updated." : "ClassTrib created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save ClassTrib",
        error,
        "Could not save ClassTrib.",
      );
    } finally {
      setSaving(false);
    }
  };
  const saveIPI = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: FrameDraft = {
      code: requiredText(ipiDraft.code),
      group: requiredText(ipiDraft.group),
      description: requiredText(ipiDraft.description),
    };
    setSaving(true);
    try {
      const selectedId = selected.ipi;
      const response = selectedId
        ? await api.updateFiscalIPIFrame(selectedId, input)
        : await api.createFiscalIPIFrame(input);
      setIpis(
        sortFrames(
          selectedId
            ? ipis.map((item) =>
                item.id === selectedId ? response.data : item,
              )
            : [...ipis, response.data],
        ),
      );
      if (!selectedId)
        setCounts((current) => ({ ...current, ipi: current.ipi + 1 }));
      setSelected((current) => ({ ...current, ipi: response.data.id }));
      selectIPI(response.data);
      setStatus({
        kind: "ok",
        text: selectedId ? "IPI frame updated." : "IPI frame created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save IPI frame",
        error,
        "Could not save IPI frame.",
      );
    } finally {
      setSaving(false);
    }
  };
  const saveISSQN = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: IssqnDraft = {
      code: requiredText(issqnDraft.code),
      description: cleanText(issqnDraft.description),
    };
    setSaving(true);
    try {
      const selectedId = selected.issqn;
      const response = selectedId
        ? await api.updateFiscalISSQNFrame(selectedId, input)
        : await api.createFiscalISSQNFrame(input);
      setIssqns(
        sortFrames(
          selectedId
            ? issqns.map((item) =>
                item.id === selectedId ? response.data : item,
              )
            : [...issqns, response.data],
        ),
      );
      if (!selectedId)
        setCounts((current) => ({ ...current, issqn: current.issqn + 1 }));
      setSelected((current) => ({ ...current, issqn: response.data.id }));
      selectISSQN(response.data);
      setStatus({
        kind: "ok",
        text: selectedId ? "ISSQN frame updated." : "ISSQN frame created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save ISSQN frame",
        error,
        "Could not save ISSQN frame.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteCurrent = async () => {
    const selectedId = selected[tab];
    if (!selectedId) return;
    if (!window.confirm("Delete " + activeConfig.title + " record?")) return;
    setSaving(true);
    try {
      if (categoryTabs.has(tab)) {
        const key = tab as CategoryTab;
        await categoryApi(key).delete(selectedId);
        setCategoryRecords(key, (items) =>
          items.filter(
            (item) => item.id !== selectedId && item.parent !== selectedId,
          ),
        );
        setParentRecords(key, (items) =>
          items.filter(
            (item) => item.id !== selectedId && item.parent !== selectedId,
          ),
        );
      }
      if (tab === "cfop") {
        await api.deleteFiscalCFOP(selectedId);
        setCfops(cfops.filter((item) => item.id !== selectedId));
      }
      if (tab === "cest") {
        await api.deleteFiscalCEST(selectedId);
        setCests(cests.filter((item) => item.id !== selectedId));
      }
      if (tab === "classtrib") {
        await api.deleteFiscalClassTrib(selectedId);
        setClassTribs(classTribs.filter((item) => item.id !== selectedId));
      }
      if (tab === "ipi") {
        await api.deleteFiscalIPIFrame(selectedId);
        setIpis(ipis.filter((item) => item.id !== selectedId));
      }
      if (tab === "issqn") {
        await api.deleteFiscalISSQNFrame(selectedId);
        setIssqns(issqns.filter((item) => item.id !== selectedId));
      }
      setCounts((current) => ({
        ...current,
        [tab]: Math.max(0, current[tab] - 1),
      }));
      setSelected((current) => ({ ...current, [tab]: null }));
      setCategoryDraft(blankCategory());
      setCfopDraft(blankCFOP());
      setCestDraft(blankCEST());
      setClassTribDraft(blankClassTrib());
      setIpiDraft(blankIPI());
      setIssqnDraft(blankISSQN());
      setStatus({ kind: "ok", text: activeConfig.title + " deleted." });
    } catch (error) {
      onRequestError(
        "Could not delete " + activeConfig.title,
        error,
        "Could not delete fiscal record.",
      );
    } finally {
      setSaving(false);
    }
  };

  const parentKey = categoryTabs.has(tab) ? (tab as CategoryTab) : null;
  const parentRecords = parentKey ? parentCategoryRecords[parentKey] : [];
  const parentRecordById = useMemo(
    () => new Map(parentRecords.map((item) => [item.id, item])),
    [parentRecords],
  );
  const parentExcludedIds =
    parentKey && selected[tab]
      ? collectDescendantIds(parentRecords, selected[tab]!)
      : [];
  const treeRows =
    tab === "cnae"
      ? buildTreeRows(cnaes, "cnae", search.cnae)
      : tab === "ncm"
        ? buildTreeRows(ncms, "ncm", search.ncm)
        : tab === "nbs"
          ? buildTreeRows(nbs, "nbs", search.nbs)
          : [];
  const parentRows = parentKey
    ? buildTreeRows(
        parentRecords,
        parentKey,
        parentSearch[parentKey],
        parentExcludedIds,
        parentExpanded[parentKey],
      )
    : [];
  const parentLabel = categoryDraft.parent
    ? categoryLabel(
        currentCategoryById.get(categoryDraft.parent) ??
          parentRecordById.get(categoryDraft.parent) ??
          null,
      )
    : "Root category";
  const frameListRows =
    tab === "cfop"
      ? frameRows(cfops, search.cfop)
      : tab === "cest"
        ? frameRows(cests, search.cest)
        : tab === "classtrib"
          ? classTribRows(classTribs, search.classtrib)
          : tab === "ipi"
            ? frameRows(ipis, search.ipi)
            : tab === "issqn"
              ? frameRows(issqns, search.issqn)
              : [];

  return (
    <>
      <section className="summary" aria-label="Fiscal category summary">
        {tabs.map((item) => (
          <Metric key={item.key} value={counts[item.key]} label={item.metric} />
        ))}
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
      <nav className="subtabs" aria-label="Fiscal category sections">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={tab === item.key ? "active" : ""}
            type="button"
            onClick={() => changeTab(item.key)}
          >
            {item.title}
          </button>
        ))}
      </nav>
      <section className="geo-workspace">
        {categoryTabs.has(tab) ? (
          <TreeList
            title={activeConfig.listTitle}
            search={search[tab]}
            onSearchChange={(value) => setSearch({ ...search, [tab]: value })}
            rows={treeRows}
            selectedId={selected[tab]}
            expanded={expanded[tab as CategoryTab]}
            loading={loadingChildren[tab as CategoryTab]}
            onSelect={(id) =>
              selectCategory(currentCategories.find((item) => item.id === id)!)
            }
            onToggle={(id) => void toggleCategory(tab as CategoryTab, id)}
          />
        ) : (
          <RecordList
            title={activeConfig.listTitle}
            search={search[tab]}
            onSearchChange={(value) => setSearch({ ...search, [tab]: value })}
            rows={frameListRows}
            selectedId={selected[tab]}
            onSelect={(id) => {
              if (tab === "ipi")
                selectIPI(ipis.find((item) => item.id === id)!);
              else if (tab === "cfop")
                selectCFOP(cfops.find((item) => item.id === id)!);
              else if (tab === "cest")
                selectCEST(cests.find((item) => item.id === id)!);
              else if (tab === "classtrib")
                selectClassTrib(classTribs.find((item) => item.id === id)!);
              else selectISSQN(issqns.find((item) => item.id === id)!);
            }}
          />
        )}
        <aside className="editor">
          {tab === "cfop" ? (
            <CFOPForm
              draft={cfopDraft}
              selectedId={selected.cfop}
              saving={saving}
              onDraft={setCfopDraft}
              onSubmit={saveCFOP}
              onNew={() => {
                setSelected((current) => ({ ...current, cfop: null }));
                setCfopDraft(blankCFOP());
              }}
              onDelete={deleteCurrent}
            />
          ) : tab === "cest" ? (
            <CESTForm
              draft={cestDraft}
              selectedId={selected.cest}
              saving={saving}
              onDraft={setCestDraft}
              onSubmit={saveCEST}
              onNew={() => {
                setSelected((current) => ({ ...current, cest: null }));
                setCestDraft(blankCEST());
              }}
              onDelete={deleteCurrent}
            />
          ) : tab === "classtrib" ? (
            <ClassTribForm
              draft={classTribDraft}
              selectedId={selected.classtrib}
              saving={saving}
              onDraft={setClassTribDraft}
              onSubmit={saveClassTrib}
              onNew={() => {
                setSelected((current) => ({ ...current, classtrib: null }));
                setClassTribDraft(blankClassTrib());
              }}
              onDelete={deleteCurrent}
            />
          ) : tab === "ipi" ? (
            <IPIForm
              draft={ipiDraft}
              selectedId={selected.ipi}
              saving={saving}
              onDraft={setIpiDraft}
              onSubmit={saveIPI}
              onNew={() => {
                setSelected((current) => ({ ...current, ipi: null }));
                setIpiDraft(blankIPI());
              }}
              onDelete={deleteCurrent}
            />
          ) : tab === "issqn" ? (
            <ISSQNForm
              draft={issqnDraft}
              selectedId={selected.issqn}
              saving={saving}
              onDraft={setIssqnDraft}
              onSubmit={saveISSQN}
              onNew={() => {
                setSelected((current) => ({ ...current, issqn: null }));
                setIssqnDraft(blankISSQN());
              }}
              onDelete={deleteCurrent}
            />
          ) : (
            <CategoryForm
              title={activeConfig.title}
              draft={categoryDraft}
              selectedId={selected[tab]}
              saving={saving}
              parentLabel={parentLabel}
              onOpenParentPicker={() =>
                openParentPicker(tab as CategoryTab, activeConfig.title)
              }
              onClearParent={() =>
                setCategoryDraft({ ...categoryDraft, parent: null })
              }
              onDraft={setCategoryDraft}
              onSubmit={saveCategory}
              onNew={() => {
                setSelected((current) => ({ ...current, [tab]: null }));
                setCategoryDraft(blankCategory());
              }}
              onDelete={deleteCurrent}
            />
          )}
        </aside>
      </section>
      {parentPicker && categoryTabs.has(tab) && (
        <ParentPickerModal
          title={parentPicker.title}
          search={parentSearch[parentPicker.key]}
          onSearchChange={(value) =>
            setParentSearch((current) => ({
              ...current,
              [parentPicker.key]: value,
            }))
          }
          rows={parentRows}
          selectedId={categoryDraft.parent}
          expanded={parentExpanded[parentPicker.key]}
          loading={parentLoadingChildren[parentPicker.key]}
          onToggle={(id) => void toggleParentCategory(parentPicker.key, id)}
          onSelect={(id) => {
            setCategoryDraft({ ...categoryDraft, parent: id });
            setParentPicker(null);
          }}
          onRoot={() => {
            setCategoryDraft({ ...categoryDraft, parent: null });
            setParentPicker(null);
          }}
          onClose={() => setParentPicker(null)}
        />
      )}
    </>
  );
}

function classTribRows(items: FiscalClassTrib[], query: string) {
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? items.filter((item) =>
        [item.code, item.cstCode, item.name, item.description].some((value) =>
          value?.toLowerCase().includes(needle),
        ),
      )
    : items;
  return filtered.map((item) => ({
    id: item.id,
    primary: item.code,
    secondary:
      [item.cstCode, item.name].filter(Boolean).join(" - ") || item.description,
  }));
}
function nullableNumber(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function categoryLabel(item: FiscalCategory | null): string {
  return item
    ? item.code + " - " + item.description
    : "Selected parent is not loaded";
}
function collectDescendantIds(
  items: FiscalCategory[],
  selectedId: string,
): string[] {
  const children = new Map<string, FiscalCategory[]>();
  for (const item of items)
    children.set(item.parent ?? "", [
      ...(children.get(item.parent ?? "") ?? []),
      item,
    ]);
  const ids = new Set<string>([selectedId]);
  const visit = (id: string) => {
    for (const child of children.get(id) ?? []) {
      if (!ids.has(child.id)) {
        ids.add(child.id);
        visit(child.id);
      }
    }
  };
  visit(selectedId);
  return [...ids];
}

function mergeFiscalCategories(
  left: FiscalCategory[],
  right: FiscalCategory[],
): FiscalCategory[] {
  const byId = new Map<string, FiscalCategory>();
  for (const item of left) byId.set(item.id, item);
  for (const item of right) byId.set(item.id, item);
  return [...byId.values()].sort((a, b) => a.code.localeCompare(b.code));
}
function mergeIds(left: string[], right: string[]): string[] {
  return [...new Set([...left, ...right])];
}
function collectAncestorIds(
  items: FiscalCategory[],
  selectedId: string,
): string[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ancestors: string[] = [];
  let cursor = byId.get(selectedId)?.parent ?? null;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    ancestors.unshift(cursor);
    cursor = byId.get(cursor)?.parent ?? null;
  }
  return ancestors;
}
