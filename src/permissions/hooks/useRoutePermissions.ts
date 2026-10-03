import { useEffect, useMemo, useState } from "react";
import type React from "react";
import type { ApiClient, StatusState, RoutePermission } from "../../shared";
import type {
  EditorMode,
  FilterState,
  PermissionFormInput,
} from "../components/types";
import {
  blankPermission,
  normalizeDraft,
  sortPermissions,
  toFormInput,
} from "./permissionLogic";

type RequestErrorHandler = (
  title: string,
  error: unknown,
  fallback: string,
) => void;

export function useRoutePermissions({
  api,
  onRequestError,
}: {
  api: ApiClient;
  onRequestError: RequestErrorHandler;
}) {
  const [permissions, setPermissions] = useState<RoutePermission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>("empty");
  const [draft, setDraft] = useState<PermissionFormInput>(blankPermission);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<StatusState>({ kind: "idle", text: "" });
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    audience: "all",
    section: "all",
    method: "all",
    employeeType: "all",
  });

  const loadPermissions = async () => {
    setStatus({ kind: "loading", text: "Loading route permissions..." });
    try {
      const response = await api.listPermissions();
      const next = [...response.data].sort(sortPermissions);
      setPermissions(next);
      setStatus({ kind: "ok", text: "Route permissions loaded." });
      if (
        selectedId &&
        !next.some((permission) => permission.id === selectedId)
      ) {
        setSelectedId(null);
        setEditorMode("empty");
        setDraft(blankPermission());
      }
    } catch (error) {
      setStatus({ kind: "error", text: "Could not load route permissions." });
      onRequestError(
        "Could not load route permissions",
        error,
        "Check the backend connection and try again.",
      );
    }
  };

  useEffect(() => {
    void loadPermissions();
  }, [api]);

  const reloadZealPermissionCache = async (): Promise<boolean> => {
    try {
      await api.reloadZealPermissionCache();
      return true;
    } catch (error) {
      setStatus({
        kind: "error",
        text: "Route permission saved, but Zeal cache reload failed.",
      });
      onRequestError(
        "Could not reload Zeal permission cache",
        error,
        "The permission was saved in Enhasa, but Zeal may still be using its previous cache.",
      );
      return false;
    }
  };

  const selected = useMemo(
    () =>
      permissions.find((permission) => permission.id === selectedId) ?? null,
    [permissions, selectedId],
  );

  const sections = useMemo(
    () =>
      [
        ...new Set(
          permissions.map((permission) => permission.section).filter(Boolean),
        ),
      ].sort(),
    [permissions],
  );

  const filterMethods = useMemo(
    () =>
      [...new Set(permissions.map((permission) => permission.method))].sort(),
    [permissions],
  );

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return permissions.filter((permission) => {
      if (filters.audience !== "all" && permission.audience !== filters.audience) return false;
      if (filters.section !== "all" && permission.section !== filters.section)
        return false;
      if (filters.method !== "all" && permission.method !== filters.method)
        return false;
      if (
        filters.employeeType !== "all" &&
        !permission.allowedEmployeeTypes.includes(filters.employeeType as never)
      ) {
        return false;
      }
      if (!search) return true;
      return [
        permission.audience,
        permission.path,
        permission.operation,
        permission.permission,
        permission.section,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [filters, permissions]);

  const configuredCount = permissions.filter(
    (permission) => permission.allowedEmployeeTypes.length,
  ).length;
  const activeCount = permissions.filter(
    (permission) => permission.active,
  ).length;

  const selectPermission = (id: string) => {
    const permission = permissions.find((item) => item.id === id);
    if (!permission) return;
    setSelectedId(id);
    setEditorMode("edit");
    setDraft(toFormInput(permission));
  };

  const startCreate = () => {
    setSelectedId(null);
    setEditorMode("create");
    setDraft(blankPermission());
  };

  const saveDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeDraft(draft);
    setSaving(true);
    try {
      if (editorMode === "edit" && selected) {
        const response = await api.updatePermission(selected.id, normalized);
        setPermissions((current) =>
          current
            .map((permission) =>
              permission.id === selected.id ? response.data : permission,
            )
            .sort(sortPermissions),
        );
        setSelectedId(response.data.id);
        setDraft(toFormInput(response.data));
        const reloaded = await reloadZealPermissionCache();
        if (reloaded) setStatus({ kind: "ok", text: "Route permission updated and Zeal cache reloaded." });
      } else {
        const response = await api.createPermission(normalized);
        setPermissions((current) =>
          [...current, response.data].sort(sortPermissions),
        );
        setSelectedId(response.data.id);
        setEditorMode("edit");
        setDraft(toFormInput(response.data));
        const reloaded = await reloadZealPermissionCache();
        if (reloaded) setStatus({ kind: "ok", text: "Route permission created and Zeal cache reloaded." });
      }
    } catch (error) {
      setStatus({ kind: "error", text: "Could not save route permission." });
      onRequestError(
        "Could not save route permission",
        error,
        "Review the route permission data and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.deletePermission(selected.id);
      setPermissions((current) =>
        current.filter((permission) => permission.id !== selected.id),
      );
      const reloaded = await reloadZealPermissionCache();
      setSelectedId(null);
      setEditorMode("empty");
      setDraft(blankPermission());
      if (reloaded) setStatus({ kind: "ok", text: "Route permission deleted and Zeal cache reloaded." });
    } catch (error) {
      setStatus({ kind: "error", text: "Could not delete route permission." });
      onRequestError(
        "Could not delete route permission",
        error,
        "Try again after confirming the route still exists.",
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    permissions,
    filtered,
    selectedId,
    editorMode,
    draft,
    saving,
    status,
    filters,
    sections,
    filterMethods,
    configuredCount,
    activeCount,
    setFilters,
    setDraft,
    loadPermissions,
    selectPermission,
    startCreate,
    saveDraft,
    deleteSelected,
  };
}
