import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Metric,
  Status,
  cleanText,
  fetchAllPages,
  label,
  requiredText,
} from "../shared";
import {
  MirrorSection,
  ProductMirrorForm,
  ScheduleMirrorForm,
  ServiceMirrorForm,
  WeeklyRulesMirrorEditor,
} from "./components";
import type { ApiClient } from "../shared";
import type {
  ProductCategoryMirror,
  ProductCategoryMirrorInput,
  ServiceCategoryMirror,
  ServiceCategoryMirrorInput,
  WorkScheduleTemplateMirror,
  WorkScheduleTemplateMirrorInput,
  WorkScheduleTemplateWeeklyRuleMirror,
  WorkScheduleTemplateWeeklyRuleMirrorInput,
} from "../shared";

type MirrorTab = "products" | "services" | "schedules";
type StatusState = { kind: "idle" | "ok" | "error" | "loading"; text: string };
type RequestErrorHandler = (
  title: string,
  error: unknown,
  fallback: string,
) => void;

const blankProduct = (): ProductCategoryMirrorInput => ({
  name: "",
  parentId: null,
  recursive: false,
  reference: null,
});
const blankService = (): ServiceCategoryMirrorInput => ({
  name: "",
  parentId: null,
  recursive: false,
  reference: null,
});
const blankSchedule = (): WorkScheduleTemplateMirrorInput => ({
  name: "",
  description: "",
  timezone: "UTC-03",
});

export function MirrorsEditor({
  api,
  onRequestError,
}: {
  api: ApiClient;
  onRequestError: RequestErrorHandler;
}) {
  const [tab, setTab] = useState<MirrorTab>("products");
  const [products, setProducts] = useState<ProductCategoryMirror[]>([]);
  const [services, setServices] = useState<ServiceCategoryMirror[]>([]);
  const [schedules, setSchedules] = useState<WorkScheduleTemplateMirror[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [scheduleDetailId, setScheduleDetailId] = useState<string | null>(null);
  const [weeklyRules, setWeeklyRules] = useState<WorkScheduleTemplateWeeklyRuleMirror[]>([]);
  const [weeklyRulesLoading, setWeeklyRulesLoading] = useState(false);
  const [weeklyRulesSaving, setWeeklyRulesSaving] = useState(false);
  const [productDraft, setProductDraft] =
    useState<ProductCategoryMirrorInput>(blankProduct);
  const [serviceDraft, setServiceDraft] =
    useState<ServiceCategoryMirrorInput>(blankService);
  const [scheduleDraft, setScheduleDraft] =
    useState<WorkScheduleTemplateMirrorInput>(blankSchedule);
  const [productSearch, setProductSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [status, setStatus] = useState<StatusState>({ kind: "idle", text: "" });
  const [saving, setSaving] = useState(false);

  const productById = useMemo(
    () => new Map(products.map((item) => [item.id, item])),
    [products],
  );
  const serviceById = useMemo(
    () => new Map(services.map((item) => [item.id, item])),
    [services],
  );
  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return products;
    return products.filter((item) =>
      [
        item.name,
        productById.get(item.parentId ?? "")?.name,
        item.recursive ? "recursive" : "single",
        item.reference,
      ].some((value) => value?.toLowerCase().includes(search)),
    );
  }, [productById, productSearch, products]);
  const filteredServices = useMemo(() => {
    const search = serviceSearch.trim().toLowerCase();
    if (!search) return services;
    return services.filter((item) =>
      [item.name, serviceById.get(item.parentId ?? "")?.name, item.recursive ? "recursive" : "single", item.reference].some((value) =>
        value?.toLowerCase().includes(search),
      ),
    );
  }, [serviceById, serviceSearch, services]);
  const filteredSchedules = useMemo(() => {
    const search = scheduleSearch.trim().toLowerCase();
    if (!search) return schedules;
    return schedules.filter((item) =>
      [item.name, item.description, item.timezone].some((value) =>
        value?.toLowerCase().includes(search),
      ),
    );
  }, [scheduleSearch, schedules]);

  const sortNamed = <T extends { name: string | null; id: string }>(
    items: T[],
  ) =>
    [...items].sort((left, right) =>
      label(left.name, left.id).localeCompare(label(right.name, right.id)),
    );
  const sortSchedules = (items: WorkScheduleTemplateMirror[]) =>
    [...items].sort((left, right) => left.name.localeCompare(right.name));

  const load = async () => {
    setStatus({ kind: "loading", text: "Loading mirrors..." });
    try {
      const [
        productCountResponse,
        serviceCountResponse,
        scheduleCountResponse,
        productRecords,
        serviceRecords,
        scheduleRecords,
      ] = await Promise.all([
        api.countProductCategoryMirrors(),
        api.countServiceCategoryMirrors(),
        api.countWorkScheduleTemplateMirrors(),
        fetchAllPages((params) => api.listProductCategoryMirrors(params)),
        fetchAllPages((params) => api.listServiceCategoryMirrors(params)),
        fetchAllPages((params) => api.listWorkScheduleTemplateMirrors(params)),
      ]);
      const sortedProducts = sortNamed(productRecords);
      const sortedServices = sortNamed(serviceRecords);
      const sortedSchedules = sortSchedules(scheduleRecords);
      setProductCount(productCountResponse.count);
      setServiceCount(serviceCountResponse.count);
      setScheduleCount(scheduleCountResponse.count);
      setProducts(sortedProducts);
      setServices(sortedServices);
      setSchedules(sortedSchedules);
      setSelectedProductId(null);
      setProductDraft(blankProduct());
      setSelectedServiceId(null);
      setServiceDraft(blankService());
      setSelectedScheduleId(null);
      setScheduleDetailId(null);
      setWeeklyRules([]);
      setScheduleDraft(blankSchedule());
      setStatus({ kind: "ok", text: "Loaded mirror records." });
    } catch (error) {
      setStatus({ kind: "error", text: "Could not load mirror records." });
      onRequestError(
        "Could not load mirrors",
        error,
        "Could not load mirror records.",
      );
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const changeTab = (nextTab: MirrorTab) => {
    setTab(nextTab);
    if (nextTab === "products") {
      setSelectedProductId(null);
      setProductDraft(blankProduct());
    }
    if (nextTab === "services") {
      setSelectedServiceId(null);
      setServiceDraft(blankService());
    }
    if (nextTab === "schedules") {
      setScheduleDetailId(null);
      setWeeklyRules([]);
      setSelectedScheduleId(null);
      setScheduleDraft(blankSchedule());
    }
  };

  const selectProduct = (item: ProductCategoryMirror) => {
    setSelectedProductId(item.id);
    setProductDraft({
      name: item.name,
      parentId: item.parentId,
      recursive: item.recursive,
      reference: item.reference,
    });
  };
  const selectService = (item: ServiceCategoryMirror) => {
    setSelectedServiceId(item.id);
    setServiceDraft({ name: item.name, parentId: item.parentId, recursive: item.recursive, reference: item.reference });
  };
  const selectSchedule = (item: WorkScheduleTemplateMirror) => {
    setScheduleDetailId(null);
    setWeeklyRules([]);
    setSelectedScheduleId(item.id);
    setScheduleDraft({
      name: item.name,
      description: item.description,
      timezone: item.timezone,
    });
  };

  const weekdayOrder = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const openWeeklyRules = async (templateId: string) => {
    setScheduleDetailId(templateId);
    setSelectedScheduleId(templateId);
    setWeeklyRules([]);
    setWeeklyRulesLoading(true);
    try {
      const records = await fetchAllPages((params) =>
        api.listWorkScheduleTemplateWeeklyRuleMirrors(params),
      );
      const order = new Map(weekdayOrder.map((day, index) => [day, index]));
      setWeeklyRules(
        records
          .filter((rule) => rule.workScheduleTemplateMirrorId === templateId)
          .sort((left, right) =>
            (order.get(left.weekday) ?? 7) - (order.get(right.weekday) ?? 7),
          ),
      );
    } catch (error) {
      onRequestError(
        "Could not load weekly rules",
        error,
        "Could not load the weekly rules for this template.",
      );
    } finally {
      setWeeklyRulesLoading(false);
    }
  };

  const saveWeeklyRules = async () => {
    setWeeklyRulesSaving(true);
    try {
      const updated = await Promise.all(
        weeklyRules.map((rule) => {
          const input: Partial<WorkScheduleTemplateWeeklyRuleMirrorInput> = {
            startTime: rule.startTime,
            endTime: rule.endTime,
            breakStartTime: rule.breakStartTime,
            breakEndTime: rule.breakEndTime,
            active: rule.active,
          };
          return api.updateWorkScheduleTemplateWeeklyRuleMirror(rule.id, input);
        }),
      );
      setWeeklyRules(updated.map((response) => response.data));
      setStatus({ kind: "ok", text: "Weekly rules updated." });
    } catch (error) {
      onRequestError(
        "Could not save weekly rules",
        error,
        "Could not save the weekly rules.",
      );
    } finally {
      setWeeklyRulesSaving(false);
    }
  };

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: ProductCategoryMirrorInput = {
      name: cleanText(productDraft.name),
      parentId: productDraft.parentId || null,
      recursive: productDraft.recursive,
      reference: productDraft.reference || null,
    };
    setSaving(true);
    try {
      const response = selectedProductId
        ? await api.updateProductCategoryMirror(selectedProductId, input)
        : await api.createProductCategoryMirror(input);
      setProducts(
        sortNamed(
          selectedProductId
            ? products.map((item) =>
                item.id === selectedProductId ? response.data : item,
              )
            : [...products, response.data],
        ),
      );
      if (!selectedProductId) setProductCount((current) => current + 1);
      setSelectedProductId(response.data.id);
      selectProduct(response.data);
      setStatus({
        kind: "ok",
        text: selectedProductId
          ? "Product category mirror updated."
          : "Product category mirror created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save product category mirror",
        error,
        "Could not save product category mirror.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: ServiceCategoryMirrorInput = {
      name: cleanText(serviceDraft.name),
      parentId: serviceDraft.parentId || null,
      recursive: serviceDraft.recursive,
      reference: serviceDraft.reference || null,
    };
    setSaving(true);
    try {
      const response = selectedServiceId
        ? await api.updateServiceCategoryMirror(selectedServiceId, input)
        : await api.createServiceCategoryMirror(input);
      setServices(
        sortNamed(
          selectedServiceId
            ? services.map((item) =>
                item.id === selectedServiceId ? response.data : item,
              )
            : [...services, response.data],
        ),
      );
      if (!selectedServiceId) setServiceCount((current) => current + 1);
      setSelectedServiceId(response.data.id);
      selectService(response.data);
      setStatus({
        kind: "ok",
        text: selectedServiceId
          ? "Service category mirror updated."
          : "Service category mirror created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save service category mirror",
        error,
        "Could not save service category mirror.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: WorkScheduleTemplateMirrorInput = {
      name: requiredText(scheduleDraft.name),
      description: cleanText(scheduleDraft.description),
      timezone: requiredText(scheduleDraft.timezone) || "UTC-03",
    };
    setSaving(true);
    try {
      const response = selectedScheduleId
        ? await api.updateWorkScheduleTemplateMirror(selectedScheduleId, input)
        : await api.createWorkScheduleTemplateMirror(input);
      setSchedules(
        sortSchedules(
          selectedScheduleId
            ? schedules.map((item) =>
                item.id === selectedScheduleId ? response.data : item,
              )
            : [...schedules, response.data],
        ),
      );
      if (!selectedScheduleId) setScheduleCount((current) => current + 1);
      setSelectedScheduleId(response.data.id);
      selectSchedule(response.data);
      setStatus({
        kind: "ok",
        text: selectedScheduleId
          ? "Work schedule template mirror updated."
          : "Work schedule template mirror created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save work schedule template mirror",
        error,
        "Could not save work schedule template mirror.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!selectedProductId) return;
    const selected = products.find((item) => item.id === selectedProductId);
    if (
      !window.confirm(
        "Delete product category mirror " +
          label(selected?.name, selectedProductId) +
          "?",
      )
    )
      return;
    setSaving(true);
    try {
      await api.deleteProductCategoryMirror(selectedProductId);
      setProducts(products.filter((item) => item.id !== selectedProductId));
      setProductCount((current) => Math.max(0, current - 1));
      setSelectedProductId(null);
      setProductDraft(blankProduct());
      setStatus({ kind: "ok", text: "Product category mirror deleted." });
    } catch (error) {
      onRequestError(
        "Could not delete product category mirror",
        error,
        "Could not delete product category mirror.",
      );
    } finally {
      setSaving(false);
    }
  };
  const deleteService = async () => {
    if (!selectedServiceId) return;
    const selected = services.find((item) => item.id === selectedServiceId);
    if (
      !window.confirm(
        "Delete service category mirror " +
          label(selected?.name, selectedServiceId) +
          "?",
      )
    )
      return;
    setSaving(true);
    try {
      await api.deleteServiceCategoryMirror(selectedServiceId);
      setServices(services.filter((item) => item.id !== selectedServiceId));
      setServiceCount((current) => Math.max(0, current - 1));
      setSelectedServiceId(null);
      setServiceDraft(blankService());
      setStatus({ kind: "ok", text: "Service category mirror deleted." });
    } catch (error) {
      onRequestError(
        "Could not delete service category mirror",
        error,
        "Could not delete service category mirror.",
      );
    } finally {
      setSaving(false);
    }
  };
  const deleteSchedule = async () => {
    if (!selectedScheduleId) return;
    const selected = schedules.find((item) => item.id === selectedScheduleId);
    if (
      !window.confirm(
        "Delete work schedule template mirror " +
          label(selected?.name, selectedScheduleId) +
          "?",
      )
    )
      return;
    setSaving(true);
    try {
      await api.deleteWorkScheduleTemplateMirror(selectedScheduleId);
      setSchedules(schedules.filter((item) => item.id !== selectedScheduleId));
      setScheduleCount((current) => Math.max(0, current - 1));
      setSelectedScheduleId(null);
      setScheduleDraft(blankSchedule());
      setStatus({ kind: "ok", text: "Work schedule template mirror deleted." });
    } catch (error) {
      onRequestError(
        "Could not delete work schedule template mirror",
        error,
        "Could not delete work schedule template mirror.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="summary" aria-label="Mirror summary">
        <Metric value={productCount} label="Product mirrors" />
        <Metric value={serviceCount} label="Service mirrors" />
        <Metric value={scheduleCount} label="Schedule mirrors" />
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
      <nav className="subtabs" aria-label="Mirror editor sections">
        <button
          className={tab === "products" ? "active" : ""}
          type="button"
          onClick={() => changeTab("products")}
        >
          Product categories
        </button>
        <button
          className={tab === "services" ? "active" : ""}
          type="button"
          onClick={() => changeTab("services")}
        >
          Service categories
        </button>
        <button
          className={tab === "schedules" ? "active" : ""}
          type="button"
          onClick={() => changeTab("schedules")}
        >
          Work schedules
        </button>
      </nav>
      {tab === "products" && (
        <MirrorSection
          title="Product category mirrors"
          search={productSearch}
          onSearchChange={setProductSearch}
          rows={filteredProducts.map((item) => ({
            id: item.id,
            primary: label(item.name, "Unnamed category"),
            secondary: [
              item.recursive ? "recursive" : "single",
              item.reference || "no reference",
              productById.get(item.parentId ?? "")?.name
                ? "parent " + productById.get(item.parentId ?? "")?.name
                : "root",
            ].join(" / "),
          }))}
          selectedId={selectedProductId}
          onSelect={(id) =>
            selectProduct(products.find((item) => item.id === id)!)
          }
        >
          <ProductMirrorForm
            draft={productDraft}
            selectedId={selectedProductId}
            saving={saving}
            products={products}
            onDraft={setProductDraft}
            onSubmit={saveProduct}
            onNew={() => {
              setSelectedProductId(null);
              setProductDraft(blankProduct());
            }}
            onDelete={deleteProduct}
          />
        </MirrorSection>
      )}
      {tab === "services" && (
        <MirrorSection
          title="Service category mirrors"
          search={serviceSearch}
          onSearchChange={setServiceSearch}
          rows={filteredServices.map((item) => ({
            id: item.id,
            primary: label(item.name, "Unnamed category"),
            secondary: [
              item.recursive ? "recursive" : "single",
              item.reference || "no reference",
              serviceById.get(item.parentId ?? "")?.name
                ? "parent " + serviceById.get(item.parentId ?? "")?.name
                : "root",
            ].join(" / "),
          }))}
          selectedId={selectedServiceId}
          onSelect={(id) =>
            selectService(services.find((item) => item.id === id)!)
          }
        >
          <ServiceMirrorForm
            draft={serviceDraft}
            selectedId={selectedServiceId}
            saving={saving}
            services={services}
            onDraft={setServiceDraft}
            onSubmit={saveService}
            onNew={() => {
              setSelectedServiceId(null);
              setServiceDraft(blankService());
            }}
            onDelete={deleteService}
          />
        </MirrorSection>
      )}
      {tab === "schedules" && (
        <MirrorSection
          title="Work schedule template mirrors"
          search={scheduleSearch}
          onSearchChange={setScheduleSearch}
          rows={filteredSchedules.map((item) => ({
            id: item.id,
            primary: item.name,
            secondary: [item.timezone, item.description]
              .filter(Boolean)
              .join(" / "),
          }))}
          selectedId={selectedScheduleId}
          onSelect={(id) =>
            selectSchedule(schedules.find((item) => item.id === id)!)
          }
          onDrill={(id) => void openWeeklyRules(id)}
          drillLabel="Edit weekly rules"
        >
          {scheduleDetailId ? (
            <WeeklyRulesMirrorEditor
              templateName={schedules.find((item) => item.id === scheduleDetailId)?.name ?? scheduleDetailId}
              rules={weeklyRules}
              loading={weeklyRulesLoading}
              saving={weeklyRulesSaving}
              onChange={(nextRule) => setWeeklyRules((current) => current.map((rule) => rule.id === nextRule.id ? nextRule : rule))}
              onBack={() => { setScheduleDetailId(null); setWeeklyRules([]); }}
              onSave={() => void saveWeeklyRules()}
            />
          ) : (
          <ScheduleMirrorForm
            draft={scheduleDraft}
            selectedId={selectedScheduleId}
            saving={saving}
            onDraft={setScheduleDraft}
            onSubmit={saveSchedule}
            onNew={() => {
              setSelectedScheduleId(null);
              setScheduleDraft(blankSchedule());
            }}
            onDelete={deleteSchedule}
          />
          )}
        </MirrorSection>
      )}
    </>
  );
}
