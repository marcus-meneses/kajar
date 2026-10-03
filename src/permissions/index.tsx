import { Status } from "../shared";
import type { ApiClient } from "../shared";
import {
  PermissionEditor,
  PermissionFilters,
  PermissionSummary,
  PermissionTable,
} from "./components";
import { useRoutePermissions } from "./hooks/useRoutePermissions";

type RequestErrorHandler = (
  title: string,
  error: unknown,
  fallback: string,
) => void;

export function PermissionsEditor({
  api,
  onRequestError,
}: {
  api: ApiClient;
  onRequestError: RequestErrorHandler;
}) {
  const permissions = useRoutePermissions({ api, onRequestError });

  return (
    <>
      <PermissionFilters
        filters={permissions.filters}
        sections={permissions.sections}
        methods={permissions.filterMethods}
        onChange={permissions.setFilters}
      />

      <PermissionSummary
        total={permissions.permissions.length}
        configured={permissions.configuredCount}
        active={permissions.activeCount}
        visible={permissions.filtered.length}
        onRefresh={() => void permissions.loadPermissions()}
        onCreate={permissions.startCreate}
      />

      <Status status={permissions.status} />

      <section className="workspace">
        <PermissionTable
          rows={permissions.filtered}
          selectedId={permissions.selectedId}
          search={permissions.filters.search}
          onSearchChange={(search) =>
            permissions.setFilters({ ...permissions.filters, search })
          }
          onSelect={permissions.selectPermission}
        />
        <PermissionEditor
          mode={permissions.editorMode}
          selectedId={permissions.selectedId}
          draft={permissions.draft}
          onDraftChange={permissions.setDraft}
          onSubmit={permissions.saveDraft}
          onDelete={permissions.deleteSelected}
          onCreate={permissions.startCreate}
          saving={permissions.saving}
        />
      </section>
    </>
  );
}
