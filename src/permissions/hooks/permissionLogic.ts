import type { RoutePermission } from "../../shared/types.js";
import type { PermissionFormInput } from "../components/types.js";

export const blankPermission = (): PermissionFormInput => ({
  audience: "ZEAL",
  method: "GET",
  path: "/api/",
  operation: "read",
  permission: "Describe what this route permission controls.",
  section: "Custom routes",
  allowedEmployeeTypes: ["SUP"],
  active: true,
});

export const routeKey = (route: PermissionFormInput): string =>
  route.audience + " · " + route.method + " " + route.path;

export const toFormInput = (
  permission: RoutePermission,
): PermissionFormInput => ({
  audience: permission.audience,
  method: permission.method,
  path: permission.path,
  operation: permission.operation,
  permission: permission.permission,
  section: permission.section,
  allowedEmployeeTypes: permission.allowedEmployeeTypes,
  active: permission.active,
});

export const normalizeDraft = (
  draft: PermissionFormInput,
): PermissionFormInput => ({
  ...draft,
  path: draft.path.trim().startsWith("/")
    ? draft.path.trim()
    : "/" + draft.path.trim(),
  operation: draft.operation.trim(),
  permission: draft.permission.trim(),
  section: draft.section.trim(),
  allowedEmployeeTypes: [...new Set(draft.allowedEmployeeTypes)],
});

export const sortPermissions = (
  left: RoutePermission,
  right: RoutePermission,
): number =>
  left.audience.localeCompare(right.audience) ||
  left.path.localeCompare(right.path) ||
  left.method.localeCompare(right.method);
