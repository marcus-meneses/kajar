export const employeeTypes = [
  "SUP",
  "GES",
  "GFI",
  "REC",
  "VET",
  "AVE",
  "GBT",
  "OTB",
  "GHO",
  "OPH",
  "OPM",
  "OUT",
] as const;

export type EmployeeType = (typeof employeeTypes)[number];
export const routePermissionAudiences = ["ZEAL", "KAHU"] as const;
export type RoutePermissionAudience = (typeof routePermissionAudiences)[number];
export type RoutePermissionMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RoutePermission {
  id: string;
  numericId: string | number;
  audience: RoutePermissionAudience;
  method: RoutePermissionMethod;
  path: string;
  operation: string;
  allowedEmployeeTypes: EmployeeType[];
  permission: string;
  section: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  id: string;
  numericId: string | number;
  name: string | null;
  namePTBR: string | null;
  abbreviation: string | null;
  bacenCode: number | null;
}

export interface AdministrativeState {
  id: string;
  numericId: string | number;
  name: string | null;
  abbreviation: string | null;
  ibgeCode: number | null;
  countryId: string | null;
  callCodes: string | null;
}

export interface City {
  id: string;
  numericId: string | number;
  name: string | null;
  stateId: string | null;
  ibgeCode: number | null;
}

export type CustomerStatus = "active" | "inactive" | "suspended";
export type EmployeeStatus = "active" | "inactive" | "suspended" | "terminated";
export type UserStatus = "active" | "inactive" | "suspended";

export interface Customer {
  id: string;
  numericId: string | number;
  name: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  cityId: string;
  cep: string | null;
  contactUserId: string | null;
  discount: number | null;
  fiscalName: string;
  stateSubscription: string | null;
  enterpriseSize: string;
  enterpriseType: string;
  taxRegime: string;
  timezone: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Employee {
  id: string;
  numericId: string | number;
  customerId: string;
  type: EmployeeType;
  fullName: string;
  commissionEnabled: boolean;
  displayName: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  status: EmployeeStatus;
  hiredAt: string | null;
  terminatedAt: string | null;
  canLogin: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface User {
  id: string;
  numericId: string | number;
  name: string | null;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  login: string | null;
  passwordSHA256: string | null;
  customerId: string;
  employeeId: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Species {
  id: string;
  numericId: string | number;
  commonName: string | null;
  alternateNames: string | null;
  scientificName: string | null;
}

export interface Breed {
  id: string;
  numericId: string | number;
  commonName: string | null;
  alternateNames: string | null;
  speciesId: string;
}

export interface FiscalCategory {
  id: string;
  parent: string | null;
  code: string;
  description: string;
}

export interface FiscalCFOP {
  id: string;
  numericId: string | number;
  code: string;
  description: string;
}

export interface FiscalCEST {
  id: string;
  numericId: string | number;
  item: string | null;
  code: string;
  ncm: string | null;
  description: string;
  segment: string | null;
  source: string;
}

export interface FiscalClassTrib {
  id: string;
  numericId: string | number;
  cstCode: string;
  cstDescription: string;
  code: string;
  name: string;
  description: string;
  legalText: string | null;
  lc214: string | null;
  regulationCBS: string | null;
  regulationIBS: string | null;
  rateType: string | null;
  pRedIBS: number | null;
  pRedCBS: number | null;
  tpRBSN: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  sourceUpdatedAt: string | null;
  annex: string | null;
  link: string | null;
  source: string;
}

export interface FiscalIPIFrame {
  id: string;
  numericId: string | number;
  code: string | number;
  group: string;
  description: string;
}

export interface FiscalISSQNFrame {
  id: string;
  numericId: string | number;
  code: string | number;
  description: string | null;
}

export type FiscalCategoryInput = Pick<
  FiscalCategory,
  "parent" | "code" | "description"
>;
export type FiscalCFOPInput = Pick<FiscalCFOP, "code" | "description">;
export type FiscalCESTInput = Pick<
  FiscalCEST,
  "item" | "code" | "ncm" | "description" | "segment" | "source"
>;
export type FiscalClassTribInput = Pick<
  FiscalClassTrib,
  | "cstCode"
  | "cstDescription"
  | "code"
  | "name"
  | "description"
  | "legalText"
  | "lc214"
  | "regulationCBS"
  | "regulationIBS"
  | "rateType"
  | "pRedIBS"
  | "pRedCBS"
  | "tpRBSN"
  | "dateStart"
  | "dateEnd"
  | "sourceUpdatedAt"
  | "annex"
  | "link"
  | "source"
>;
export type FiscalIPIFrameInput = {
  code: string;
  group: string;
  description: string;
};
export type FiscalISSQNFrameInput = {
  code: string;
  description: string | null;
};

export interface ProductCategoryMirror {
  id: string;
  numericId: string | number;
  name: string | null;
  parentId: string | null;
  recursive: boolean;
  reference: string | null;
}

export interface ServiceCategoryMirror {
  id: string;
  numericId: string | number;
  name: string | null;
  parentId: string | null;
  recursive: boolean;
  reference: string | null;
}

export interface WorkScheduleTemplateMirror {
  id: string;
  numericId: string | number;
  name: string;
  description: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type Weekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface WorkScheduleTemplateWeeklyRuleMirror {
  id: string;
  numericId: string | number;
  workScheduleTemplateMirrorId: string;
  weekday: Weekday;
  startTime: string | null;
  endTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  capacity: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type ProductCategoryMirrorInput = Pick<
  ProductCategoryMirror,
  "name" | "parentId" | "recursive" | "reference"
>;
export type ServiceCategoryMirrorInput = Pick<
  ServiceCategoryMirror,
  "name" | "parentId" | "recursive" | "reference"
>;
export type WorkScheduleTemplateMirrorInput = Pick<
  WorkScheduleTemplateMirror,
  "name" | "description" | "timezone"
>;

export type WorkScheduleTemplateWeeklyRuleMirrorInput = Pick<
  WorkScheduleTemplateWeeklyRuleMirror,
  | "workScheduleTemplateMirrorId"
  | "weekday"
  | "startTime"
  | "endTime"
  | "breakStartTime"
  | "breakEndTime"
  | "capacity"
  | "active"
>;

export type SpeciesInput = Pick<
  Species,
  "commonName" | "alternateNames" | "scientificName"
>;
export type BreedInput = Pick<
  Breed,
  "commonName" | "alternateNames" | "speciesId"
>;

export type CountryInput = Pick<
  Country,
  "name" | "namePTBR" | "abbreviation" | "bacenCode"
>;
export type AdministrativeStateInput = Pick<
  AdministrativeState,
  "name" | "abbreviation" | "ibgeCode" | "countryId" | "callCodes"
>;
export type CityInput = Pick<City, "name" | "stateId" | "ibgeCode">;

export type CustomerInput = Pick<
  Customer,
  | "cityId"
  | "contactUserId"
  | "fiscalName"
  | "enterpriseSize"
  | "enterpriseType"
  | "taxRegime"
  | "timezone"
  | "name"
  | "cnpj"
  | "email"
  | "phone"
  | "address"
  | "cep"
  | "discount"
  | "stateSubscription"
  | "status"
>;
export type EmployeeInput = Pick<
  Employee,
  | "customerId"
  | "type"
  | "fullName"
  | "commissionEnabled"
  | "displayName"
  | "cpf"
  | "email"
  | "phone"
  | "status"
  | "hiredAt"
  | "terminatedAt"
  | "canLogin"
  | "notes"
>;
export type UserInput = Pick<
  User,
  | "customerId"
  | "employeeId"
  | "name"
  | "cpf"
  | "email"
  | "phone"
  | "login"
  | "passwordSHA256"
  | "status"
>;


export interface AuthRefreshToken {
  id: string;
  numericId: string | number;
  tokenHashPreview: string;
  userId: string;
  app: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  userLogin: string | null;
  userEmail: string | null;
  userName: string | null;
  userCustomerId: string | null;
  userStatus: string | null;
}

export interface AuthTokenSummary {
  total: number;
  active: number;
  expired: number;
  revoked: number;
}

export interface AuthTokenListResponse {
  data: AuthRefreshToken[];
  count: number;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tokenType: "Bearer";
  expiresIn: string;
  app?: string;
}

export interface JwtPayload {
  sub: string;
  customerId: string;
  login: string;
  email: string | null;
  clearance: string;
  clearanceLevel: string;
  exp?: number;
}

export interface CountResponse {
  count: number;
}
export interface SystemProcessGroupMetric {
  key: string; label: string; active: boolean; processCount: number;
  cpuPercent: number; memoryPercent: number; residentBytes: number;
}
export interface SystemMetrics {
  sampledAt: string; hostname: string; platform: string; uptimeSeconds: number;
  cpu: { cores: number; usagePercent: number; idlePercent: number; loadAverage: number[] };
  memory: { totalBytes: number; usedBytes: number; freeBytes: number; availableBytes: number; usagePercent: number };
  swap: { totalBytes: number; usedBytes: number };
  disk: { totalBytes: number; usedBytes: number; freeBytes: number; usagePercent: number };
  processGroups: SystemProcessGroupMetric[];
}
export interface ListResponse<T> {
  data: T[];
}
export interface DataResponse<T> {
  data: T;
}
export interface ApiErrorBody {
  message?: string;
  reason?: string;
}

export interface DictionaryEntry {
  index?: string | number;
  abbreviation?: string;
  acronym?: string;
  level?: string;
  description: string;
  validSizes?: string;
  validTypes?: string;
}

export type DictionaryCollection = Record<string, DictionaryEntry[]>;

export interface FiscalFrame {
  id: string;
  numericId: string | number;
  version: string;
  policySetId: string;
  originCode: string;
  jurisdiction: "Country" | "State" | "City";
  countryId: string;
  stateId: string | null;
  cityId: string | null;
  itemType: "Product" | "Service";
  operation: "Sale" | "Service";
  priority: number;
  buyerType: "Consumer" | "Taxpayer" | "Government" | null;
  enterpriseSize: string | null;
  enterpriseType: string | null;
  taxRegime: string | null;
  fiscalNCMId: string | null;
  fiscalNBSId: string | null;
  fiscalCESTId: string | null;
  cstIcms: string | null;
  fiscalCFOPId: string | null;
  cstIpi: string | null;
  cstPis: string | null;
  cstCofins: string | null;
  CSOSN: string | null;
  fiscalClassTribId: string | null;
  dateStart: string;
  dateEnd: string | null;
  dateTime: string;
}

export interface FiscalFrameTax {
  id: string;
  numericId: string | number;
  frameId: string;
  taxRuleId: string;
  taxCode: string;
  baseSource: "ItemNet" | "ItemGross" | "AfterBaseFrameTax";
  dependsOnTaxId: string | null;
  priority: number;
  affectsInvoice: boolean;
  affectsPayment: boolean;
  phase: "Normal" | "Test" | "Transition" | "Final" | null;
}

export interface TaxRule {
  id: string;
  numericId: string | number;
  name: string;
  description: string | null;
  taxCalcMethod: "Percentage" | "FixedPerItem" | "ReducedBase" | "Exempt" | "NotApplicable";
  taxCalcParameters: Record<string, unknown>;
  dateStart: string;
  dateEnd: string | null;
  dateTime: string;
}

export interface FiscalPolicySet {
  id: string;
  numericId: string | number;
  code: string;
  name: string;
  version: number;
  status: "Draft" | "Published" | "Retired";
  description: string | null;
  dateStart: string;
  dateEnd: string | null;
  dateTime: string;
}
export type FiscalPolicySetInput = Omit<FiscalPolicySet, "id" | "numericId" | "dateTime"> & { dateTime?: string };

export type FiscalFrameInput = Omit<
  FiscalFrame,
  "id" | "numericId" | "dateTime"
> & { dateTime?: string };
export type FiscalFrameTaxInput = Omit<FiscalFrameTax, "id" | "numericId">;
export type TaxRuleInput = Omit<TaxRule, "id" | "numericId" | "dateTime"> & {
  dateTime?: string;
};
