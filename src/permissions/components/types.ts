import type { RoutePermission } from "../../shared/types.js";

export type FilterState = {
  search: string;
  audience: string;
  section: string;
  method: string;
  employeeType: string;
};
export type EditorMode = "empty" | "edit" | "create";
export type PermissionFormInput = Pick<
  RoutePermission,
  | "audience"
  | "method"
  | "path"
  | "operation"
  | "allowedEmployeeTypes"
  | "permission"
  | "section"
  | "active"
>;
