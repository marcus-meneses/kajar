import type {
  AdministrativeState,
  AdministrativeStateInput,
  ApiErrorBody,
  AuthTokenListResponse,
  AuthTokenResponse,
  AuthTokenSummary,
  Breed,
  BreedInput,
  City,
  CityInput,
  CountResponse,
  Country,
  CountryInput,
  Customer,
  CustomerInput,
  DataResponse,
  Employee,
  EmployeeInput,
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
  FiscalFrame,
  FiscalFrameInput,
  FiscalPolicySet,
  FiscalPolicySetInput,
  FiscalFrameTax,
  FiscalFrameTaxInput,
  ListResponse,
  ProductCategoryMirror,
  ProductCategoryMirrorInput,
  RoutePermission,
  TaxRule,
  TaxRuleInput,
  ServiceCategoryMirror,
  ServiceCategoryMirrorInput,
  Species,
  SpeciesInput,
  User,
  UserInput,
  WorkScheduleTemplateMirror,
  WorkScheduleTemplateMirrorInput,
  WorkScheduleTemplateWeeklyRuleMirror,
  WorkScheduleTemplateWeeklyRuleMirrorInput,
  DictionaryCollection,
  SystemMetrics,
  JwtPayload,
} from "./types";

export interface ApiClientOptions {
  baseUrl: string;
  accessToken?: string;
  refreshToken?: string;
  authBaseUrl?: string;
  onSessionRefresh?: (session: AuthTokenResponse) => void;
}

const refreshSkewMs = 60_000;

const jwtExpiresAt = (token?: string): number | null => {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

const shouldRefreshToken = (token?: string): boolean => {
  const expiresAt = jwtExpiresAt(token);
  return !token || Boolean(expiresAt && Date.now() + refreshSkewMs >= expiresAt);
};

export class ApiClient {
  private refreshPromise: Promise<void> | null = null;

  constructor(private readonly options: ApiClientOptions) {}

  getSystemMetrics(): Promise<DataResponse<SystemMetrics>> {
    return this.request<DataResponse<SystemMetrics>>("/api/system/metrics");
  }

  login(input: {
    login: string;
    email?: string;
    password: string;
    app?: string;
  }): Promise<AuthTokenResponse> {
    return this.authRequest<AuthTokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
      auth: false,
    });
  }

  getCurrentUser(): Promise<{ user: JwtPayload }> {
    return this.authRequest<{ user: JwtPayload }>("/auth/me");
  }

  getPermissionRevision(): Promise<DataResponse<{ revision: number }>> {
    return this.request<DataResponse<{ revision: number }>>("/api/permissions/revision");
  }

  getPermissionAccessMap(): Promise<DataResponse<{ revision: number; kahu: unknown[]; zeal: unknown[] }>> {
    return this.request<DataResponse<{ revision: number; kahu: unknown[]; zeal: unknown[] }>>("/api/permissions/access-map");
  }


  listAuthTokens(
    params: {
      limit?: number;
      offset?: number;
      search?: string;
      status?: "all" | "active" | "expired" | "revoked";
    } = {},
  ): Promise<AuthTokenListResponse> {
    return this.authRequest<AuthTokenListResponse>(
      this.listPath("/api/auth-tokens", params),
    );
  }

  getAuthTokenSummary(): Promise<DataResponse<AuthTokenSummary>> {
    return this.authRequest<DataResponse<AuthTokenSummary>>("/api/auth-tokens/summary");
  }

  revokeAuthToken(id: string): Promise<void> {
    return this.authRequest<void>("/api/auth-tokens/" + id + "/revoke", {
      method: "POST",
    });
  }

  listDictionaries(): Promise<DataResponse<DictionaryCollection>> {
    return this.request<DataResponse<DictionaryCollection>>(
      "/api/dictionaries",
    );
  }

  listPermissions(): Promise<ListResponse<RoutePermission>> {
    return this.authRequest<ListResponse<RoutePermission>>(
      "/api/permissions?limit=500",
    );
  }

  createPermission(
    input: Pick<
      RoutePermission,
      | "audience"
      | "method"
      | "path"
      | "operation"
      | "allowedEmployeeTypes"
      | "permission"
      | "section"
      | "active"
    >,
  ): Promise<DataResponse<RoutePermission>> {
    return this.authRequest<DataResponse<RoutePermission>>("/api/permissions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updatePermission(
    id: string,
    input: Partial<
      Pick<
        RoutePermission,
        | "audience"
        | "method"
        | "path"
        | "operation"
        | "allowedEmployeeTypes"
        | "permission"
        | "section"
        | "active"
      >
    >,
  ): Promise<DataResponse<RoutePermission>> {
    return this.authRequest<DataResponse<RoutePermission>>(
      "/api/permissions/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }

  deletePermission(id: string): Promise<void> {
    return this.authRequest<void>("/api/permissions/" + id, { method: "DELETE" });
  }

  reloadZealPermissionCache(): Promise<DataResponse<{ reloaded: boolean; source: string; routes: number; loadedAt: string; revision: number }>> {
    return this.request<DataResponse<{ reloaded: boolean; source: string; routes: number; loadedAt: string; revision: number }>>(
      "/api/permissions/reload",
      { method: "POST" },
    );
  }

  listCustomers(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<Customer>> {
    return this.request<ListResponse<Customer>>(
      this.listPath("/api/customers", params),
    );
  }

  countCustomers(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/customers/count");
  }

  createCustomer(input: CustomerInput): Promise<DataResponse<Customer>> {
    return this.request<DataResponse<Customer>>("/api/customers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateCustomer(
    id: string,
    input: Partial<CustomerInput>,
  ): Promise<DataResponse<Customer>> {
    return this.request<DataResponse<Customer>>("/api/customers/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteCustomer(id: string): Promise<void> {
    return this.request<void>("/api/customers/" + id, { method: "DELETE" });
  }

  listEmployees(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<Employee>> {
    return this.request<ListResponse<Employee>>(
      this.listPath("/api/employees", params),
    );
  }

  listEmployeesByCustomer(
    customerId: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<Employee>> {
    return this.request<ListResponse<Employee>>(
      this.listPath("/api/employees/by-customer/" + customerId, params),
    );
  }

  createEmployee(input: EmployeeInput): Promise<DataResponse<Employee>> {
    return this.request<DataResponse<Employee>>("/api/employees", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateEmployee(
    id: string,
    input: Partial<EmployeeInput>,
  ): Promise<DataResponse<Employee>> {
    return this.request<DataResponse<Employee>>("/api/employees/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteEmployee(id: string): Promise<void> {
    return this.request<void>("/api/employees/" + id, { method: "DELETE" });
  }

  listUsers(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<User>> {
    return this.request<ListResponse<User>>(
      this.listPath("/api/users", params),
    );
  }

  getUser(id: string): Promise<DataResponse<User>> {
    return this.request<DataResponse<User>>("/api/users/" + id);
  }

  listUsersByCustomer(
    customerId: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<User>> {
    return this.request<ListResponse<User>>(
      this.listPath("/api/users/by-customer/" + customerId, params),
    );
  }

  createUser(input: UserInput): Promise<DataResponse<User>> {
    return this.request<DataResponse<User>>("/api/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateUser(
    id: string,
    input: Partial<UserInput>,
  ): Promise<DataResponse<User>> {
    return this.request<DataResponse<User>>("/api/users/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteUser(id: string): Promise<void> {
    return this.request<void>("/api/users/" + id, { method: "DELETE" });
  }

  listCountries(
    params: { limit?: number; offset?: number; search?: string } = {},
  ): Promise<ListResponse<Country>> {
    return this.request<ListResponse<Country>>(
      this.listPath("/api/countries", params),
    );
  }

  getCountry(id: string): Promise<DataResponse<Country>> {
    return this.request<DataResponse<Country>>("/api/countries/" + id);
  }

  countCountries(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/countries/count");
  }

  createCountry(input: CountryInput): Promise<DataResponse<Country>> {
    return this.request<DataResponse<Country>>("/api/countries", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateCountry(
    id: string,
    input: Partial<CountryInput>,
  ): Promise<DataResponse<Country>> {
    return this.request<DataResponse<Country>>("/api/countries/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteCountry(id: string): Promise<void> {
    return this.request<void>("/api/countries/" + id, { method: "DELETE" });
  }

  listStates(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<AdministrativeState>> {
    return this.request<ListResponse<AdministrativeState>>(
      this.listPath("/api/states", params),
    );
  }

  getState(id: string): Promise<DataResponse<AdministrativeState>> {
    return this.request<DataResponse<AdministrativeState>>("/api/states/" + id);
  }

  countStates(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/states/count");
  }

  listStatesByCountry(
    countryId: string,
    params: { limit?: number; offset?: number; search?: string } = {},
  ): Promise<ListResponse<AdministrativeState>> {
    return this.request<ListResponse<AdministrativeState>>(
      this.listPath("/api/states/by-country/" + countryId, params),
    );
  }

  createState(
    input: AdministrativeStateInput,
  ): Promise<DataResponse<AdministrativeState>> {
    return this.request<DataResponse<AdministrativeState>>("/api/states", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateState(
    id: string,
    input: Partial<AdministrativeStateInput>,
  ): Promise<DataResponse<AdministrativeState>> {
    return this.request<DataResponse<AdministrativeState>>(
      "/api/states/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }

  deleteState(id: string): Promise<void> {
    return this.request<void>("/api/states/" + id, { method: "DELETE" });
  }

  listCities(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<City>> {
    return this.request<ListResponse<City>>(
      this.listPath("/api/cities", params),
    );
  }

  getCity(id: string): Promise<DataResponse<City>> {
    return this.request<DataResponse<City>>("/api/cities/" + id);
  }

  countCities(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/cities/count");
  }

  listCitiesByState(
    stateId: string,
    params: { limit?: number; offset?: number; search?: string } = {},
  ): Promise<ListResponse<City>> {
    return this.request<ListResponse<City>>(
      this.listPath("/api/cities/by-state/" + stateId, params),
    );
  }

  createCity(input: CityInput): Promise<DataResponse<City>> {
    return this.request<DataResponse<City>>("/api/cities", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateCity(
    id: string,
    input: Partial<CityInput>,
  ): Promise<DataResponse<City>> {
    return this.request<DataResponse<City>>("/api/cities/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteCity(id: string): Promise<void> {
    return this.request<void>("/api/cities/" + id, { method: "DELETE" });
  }

  listSpecies(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<Species>> {
    return this.request<ListResponse<Species>>(
      this.listPath("/api/species", params),
    );
  }

  countSpecies(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/species/count");
  }

  createSpecies(input: SpeciesInput): Promise<DataResponse<Species>> {
    return this.request<DataResponse<Species>>("/api/species", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateSpecies(
    id: string,
    input: Partial<SpeciesInput>,
  ): Promise<DataResponse<Species>> {
    return this.request<DataResponse<Species>>("/api/species/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteSpecies(id: string): Promise<void> {
    return this.request<void>("/api/species/" + id, { method: "DELETE" });
  }

  listBreeds(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<Breed>> {
    return this.request<ListResponse<Breed>>(
      this.listPath("/api/breeds", params),
    );
  }

  countBreeds(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/breeds/count");
  }

  listBreedsBySpecies(
    speciesId: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<Breed>> {
    return this.request<ListResponse<Breed>>(
      this.listPath("/api/breeds/by-species/" + speciesId, params),
    );
  }

  createBreed(input: BreedInput): Promise<DataResponse<Breed>> {
    return this.request<DataResponse<Breed>>("/api/breeds", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateBreed(
    id: string,
    input: Partial<BreedInput>,
  ): Promise<DataResponse<Breed>> {
    return this.request<DataResponse<Breed>>("/api/breeds/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteBreed(id: string): Promise<void> {
    return this.request<void>("/api/breeds/" + id, { method: "DELETE" });
  }

  listProductCategoryMirrors(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<ProductCategoryMirror>> {
    return this.request<ListResponse<ProductCategoryMirror>>(
      this.listPath("/api/product-category-mirrors", params),
    );
  }

  countProductCategoryMirrors(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/product-category-mirrors/count");
  }

  createProductCategoryMirror(
    input: ProductCategoryMirrorInput,
  ): Promise<DataResponse<ProductCategoryMirror>> {
    return this.request<DataResponse<ProductCategoryMirror>>(
      "/api/product-category-mirrors",
      { method: "POST", body: JSON.stringify(input) },
    );
  }

  updateProductCategoryMirror(
    id: string,
    input: Partial<ProductCategoryMirrorInput>,
  ): Promise<DataResponse<ProductCategoryMirror>> {
    return this.request<DataResponse<ProductCategoryMirror>>(
      "/api/product-category-mirrors/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }

  deleteProductCategoryMirror(id: string): Promise<void> {
    return this.request<void>("/api/product-category-mirrors/" + id, {
      method: "DELETE",
    });
  }

  listServiceCategoryMirrors(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<ServiceCategoryMirror>> {
    return this.request<ListResponse<ServiceCategoryMirror>>(
      this.listPath("/api/service-category-mirrors", params),
    );
  }

  countServiceCategoryMirrors(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/service-category-mirrors/count");
  }

  createServiceCategoryMirror(
    input: ServiceCategoryMirrorInput,
  ): Promise<DataResponse<ServiceCategoryMirror>> {
    return this.request<DataResponse<ServiceCategoryMirror>>(
      "/api/service-category-mirrors",
      { method: "POST", body: JSON.stringify(input) },
    );
  }

  updateServiceCategoryMirror(
    id: string,
    input: Partial<ServiceCategoryMirrorInput>,
  ): Promise<DataResponse<ServiceCategoryMirror>> {
    return this.request<DataResponse<ServiceCategoryMirror>>(
      "/api/service-category-mirrors/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }

  deleteServiceCategoryMirror(id: string): Promise<void> {
    return this.request<void>("/api/service-category-mirrors/" + id, {
      method: "DELETE",
    });
  }

  listWorkScheduleTemplateMirrors(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<WorkScheduleTemplateMirror>> {
    return this.request<ListResponse<WorkScheduleTemplateMirror>>(
      this.listPath("/api/work-schedule-template-mirrors", params),
    );
  }

  countWorkScheduleTemplateMirrors(): Promise<CountResponse> {
    return this.request<CountResponse>(
      "/api/work-schedule-template-mirrors/count",
    );
  }

  createWorkScheduleTemplateMirror(
    input: WorkScheduleTemplateMirrorInput,
  ): Promise<DataResponse<WorkScheduleTemplateMirror>> {
    return this.request<DataResponse<WorkScheduleTemplateMirror>>(
      "/api/work-schedule-template-mirrors",
      { method: "POST", body: JSON.stringify(input) },
    );
  }

  updateWorkScheduleTemplateMirror(
    id: string,
    input: Partial<WorkScheduleTemplateMirrorInput>,
  ): Promise<DataResponse<WorkScheduleTemplateMirror>> {
    return this.request<DataResponse<WorkScheduleTemplateMirror>>(
      "/api/work-schedule-template-mirrors/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }

  deleteWorkScheduleTemplateMirror(id: string): Promise<void> {
    return this.request<void>("/api/work-schedule-template-mirrors/" + id, {
      method: "DELETE",
    });
  }

  listWorkScheduleTemplateWeeklyRuleMirrors(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<WorkScheduleTemplateWeeklyRuleMirror>> {
    return this.request<ListResponse<WorkScheduleTemplateWeeklyRuleMirror>>(
      this.listPath("/api/work-schedule-template-weekly-rule-mirrors", params),
    );
  }

  updateWorkScheduleTemplateWeeklyRuleMirror(
    id: string,
    input: Partial<WorkScheduleTemplateWeeklyRuleMirrorInput>,
  ): Promise<DataResponse<WorkScheduleTemplateWeeklyRuleMirror>> {
    return this.request<DataResponse<WorkScheduleTemplateWeeklyRuleMirror>>(
      "/api/work-schedule-template-weekly-rule-mirrors/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }

  listFiscalCNAEs(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalCategory>> {
    return this.request<ListResponse<FiscalCategory>>(
      this.listPath("/api/fiscal-cnaes", params),
    );
  }
  listFiscalCNAERoots(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalCategory>> {
    return this.request<ListResponse<FiscalCategory>>(
      this.listPath("/api/fiscal-cnaes/roots", params),
    );
  }
  listFiscalCNAEChildren(
    id: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalCategory>> {
    return this.request<ListResponse<FiscalCategory>>(
      this.listPath("/api/fiscal-cnaes/children/" + id, params),
    );
  }
  countFiscalCNAEs(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/fiscal-cnaes/count");
  }
  createFiscalCNAE(
    input: FiscalCategoryInput,
  ): Promise<DataResponse<FiscalCategory>> {
    return this.request<DataResponse<FiscalCategory>>("/api/fiscal-cnaes", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
  updateFiscalCNAE(
    id: string,
    input: Partial<FiscalCategoryInput>,
  ): Promise<DataResponse<FiscalCategory>> {
    return this.request<DataResponse<FiscalCategory>>(
      "/api/fiscal-cnaes/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }
  deleteFiscalCNAE(id: string): Promise<void> {
    return this.request<void>("/api/fiscal-cnaes/" + id, { method: "DELETE" });
  }

  listFiscalNCMs(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalCategory>> {
    return this.request<ListResponse<FiscalCategory>>(
      this.listPath("/api/fiscal-ncms", params),
    );
  }
  getFiscalNCM(id: string): Promise<DataResponse<FiscalCategory>> {
    return this.request<DataResponse<FiscalCategory>>("/api/fiscal-ncms/" + id);
  }
  listFiscalNCMRoots(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalCategory>> {
    return this.request<ListResponse<FiscalCategory>>(
      this.listPath("/api/fiscal-ncms/roots", params),
    );
  }
  listFiscalNCMChildren(
    id: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalCategory>> {
    return this.request<ListResponse<FiscalCategory>>(
      this.listPath("/api/fiscal-ncms/children/" + id, params),
    );
  }
  countFiscalNCMs(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/fiscal-ncms/count");
  }
  createFiscalNCM(
    input: FiscalCategoryInput,
  ): Promise<DataResponse<FiscalCategory>> {
    return this.request<DataResponse<FiscalCategory>>("/api/fiscal-ncms", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
  updateFiscalNCM(
    id: string,
    input: Partial<FiscalCategoryInput>,
  ): Promise<DataResponse<FiscalCategory>> {
    return this.request<DataResponse<FiscalCategory>>(
      "/api/fiscal-ncms/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }
  deleteFiscalNCM(id: string): Promise<void> {
    return this.request<void>("/api/fiscal-ncms/" + id, { method: "DELETE" });
  }

  listFiscalNBS(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalCategory>> {
    return this.request<ListResponse<FiscalCategory>>(
      this.listPath("/api/fiscal-nbs", params),
    );
  }
  listFiscalNBSRoots(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalCategory>> {
    return this.request<ListResponse<FiscalCategory>>(
      this.listPath("/api/fiscal-nbs/roots", params),
    );
  }
  listFiscalNBSChildren(
    id: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalCategory>> {
    return this.request<ListResponse<FiscalCategory>>(
      this.listPath("/api/fiscal-nbs/children/" + id, params),
    );
  }
  countFiscalNBS(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/fiscal-nbs/count");
  }
  createFiscalNBS(
    input: FiscalCategoryInput,
  ): Promise<DataResponse<FiscalCategory>> {
    return this.request<DataResponse<FiscalCategory>>("/api/fiscal-nbs", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
  updateFiscalNBS(
    id: string,
    input: Partial<FiscalCategoryInput>,
  ): Promise<DataResponse<FiscalCategory>> {
    return this.request<DataResponse<FiscalCategory>>("/api/fiscal-nbs/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }
  deleteFiscalNBS(id: string): Promise<void> {
    return this.request<void>("/api/fiscal-nbs/" + id, { method: "DELETE" });
  }

  listFiscalCFOPs(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalCFOP>> {
    return this.request<ListResponse<FiscalCFOP>>(
      this.listPath("/api/fiscal-cfops", params),
    );
  }
  getFiscalCFOP(id: string): Promise<DataResponse<FiscalCFOP>> {
    return this.request<DataResponse<FiscalCFOP>>("/api/fiscal-cfops/" + id);
  }
  countFiscalCFOPs(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/fiscal-cfops/count");
  }
  createFiscalCFOP(input: FiscalCFOPInput): Promise<DataResponse<FiscalCFOP>> {
    return this.request<DataResponse<FiscalCFOP>>("/api/fiscal-cfops", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
  updateFiscalCFOP(
    id: string,
    input: Partial<FiscalCFOPInput>,
  ): Promise<DataResponse<FiscalCFOP>> {
    return this.request<DataResponse<FiscalCFOP>>("/api/fiscal-cfops/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }
  deleteFiscalCFOP(id: string): Promise<void> {
    return this.request<void>("/api/fiscal-cfops/" + id, { method: "DELETE" });
  }

  listFiscalCESTs(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalCEST>> {
    return this.request<ListResponse<FiscalCEST>>(
      this.listPath("/api/fiscal-cests", params),
    );
  }
  getFiscalCEST(id: string): Promise<DataResponse<FiscalCEST>> {
    return this.request<DataResponse<FiscalCEST>>("/api/fiscal-cests/" + id);
  }
  countFiscalCESTs(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/fiscal-cests/count");
  }
  createFiscalCEST(input: FiscalCESTInput): Promise<DataResponse<FiscalCEST>> {
    return this.request<DataResponse<FiscalCEST>>("/api/fiscal-cests", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
  updateFiscalCEST(
    id: string,
    input: Partial<FiscalCESTInput>,
  ): Promise<DataResponse<FiscalCEST>> {
    return this.request<DataResponse<FiscalCEST>>("/api/fiscal-cests/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }
  deleteFiscalCEST(id: string): Promise<void> {
    return this.request<void>("/api/fiscal-cests/" + id, { method: "DELETE" });
  }

  listFiscalClassTribs(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalClassTrib>> {
    return this.request<ListResponse<FiscalClassTrib>>(
      this.listPath("/api/fiscal-class-tribs", params),
    );
  }
  getFiscalClassTrib(id: string): Promise<DataResponse<FiscalClassTrib>> {
    return this.request<DataResponse<FiscalClassTrib>>(
      "/api/fiscal-class-tribs/" + id,
    );
  }
  countFiscalClassTribs(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/fiscal-class-tribs/count");
  }
  createFiscalClassTrib(
    input: FiscalClassTribInput,
  ): Promise<DataResponse<FiscalClassTrib>> {
    return this.request<DataResponse<FiscalClassTrib>>(
      "/api/fiscal-class-tribs",
      { method: "POST", body: JSON.stringify(input) },
    );
  }
  updateFiscalClassTrib(
    id: string,
    input: Partial<FiscalClassTribInput>,
  ): Promise<DataResponse<FiscalClassTrib>> {
    return this.request<DataResponse<FiscalClassTrib>>(
      "/api/fiscal-class-tribs/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }
  deleteFiscalClassTrib(id: string): Promise<void> {
    return this.request<void>("/api/fiscal-class-tribs/" + id, {
      method: "DELETE",
    });
  }

  listFiscalIPIFrames(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalIPIFrame>> {
    return this.request<ListResponse<FiscalIPIFrame>>(
      this.listPath("/api/fiscal-ipi-frames", params),
    );
  }
  countFiscalIPIFrames(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/fiscal-ipi-frames/count");
  }
  createFiscalIPIFrame(
    input: FiscalIPIFrameInput,
  ): Promise<DataResponse<FiscalIPIFrame>> {
    return this.request<DataResponse<FiscalIPIFrame>>(
      "/api/fiscal-ipi-frames",
      { method: "POST", body: JSON.stringify(input) },
    );
  }
  updateFiscalIPIFrame(
    id: string,
    input: Partial<FiscalIPIFrameInput>,
  ): Promise<DataResponse<FiscalIPIFrame>> {
    return this.request<DataResponse<FiscalIPIFrame>>(
      "/api/fiscal-ipi-frames/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }
  deleteFiscalIPIFrame(id: string): Promise<void> {
    return this.request<void>("/api/fiscal-ipi-frames/" + id, {
      method: "DELETE",
    });
  }

  listFiscalISSQNFrames(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalISSQNFrame>> {
    return this.request<ListResponse<FiscalISSQNFrame>>(
      this.listPath("/api/fiscal-issqn-frames", params),
    );
  }
  countFiscalISSQNFrames(): Promise<CountResponse> {
    return this.request<CountResponse>("/api/fiscal-issqn-frames/count");
  }
  createFiscalISSQNFrame(
    input: FiscalISSQNFrameInput,
  ): Promise<DataResponse<FiscalISSQNFrame>> {
    return this.request<DataResponse<FiscalISSQNFrame>>(
      "/api/fiscal-issqn-frames",
      { method: "POST", body: JSON.stringify(input) },
    );
  }
  updateFiscalISSQNFrame(
    id: string,
    input: Partial<FiscalISSQNFrameInput>,
  ): Promise<DataResponse<FiscalISSQNFrame>> {
    return this.request<DataResponse<FiscalISSQNFrame>>(
      "/api/fiscal-issqn-frames/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }
  deleteFiscalISSQNFrame(id: string): Promise<void> {
    return this.request<void>("/api/fiscal-issqn-frames/" + id, {
      method: "DELETE",
    });
  }

  listFiscalFrames(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalFrame>> {
    return this.request<ListResponse<FiscalFrame>>(
      this.listPath("/api/fiscal-frames", params),
    );
  }
  listFiscalPolicySets(params: { limit?: number; offset?: number } = {}): Promise<ListResponse<FiscalPolicySet>> {
    return this.request<ListResponse<FiscalPolicySet>>(this.listPath("/api/fiscal-policy-sets", params));
  }
  createFiscalPolicySet(input: FiscalPolicySetInput): Promise<DataResponse<FiscalPolicySet>> {
    return this.request<DataResponse<FiscalPolicySet>>("/api/fiscal-policy-sets", { method: "POST", body: JSON.stringify(input) });
  }
  updateFiscalPolicySet(id: string, input: Partial<FiscalPolicySetInput>): Promise<DataResponse<FiscalPolicySet>> {
    return this.request<DataResponse<FiscalPolicySet>>("/api/fiscal-policy-sets/" + id, { method: "PATCH", body: JSON.stringify(input) });
  }
  deleteFiscalPolicySet(id: string): Promise<void> {
    return this.request<void>("/api/fiscal-policy-sets/" + id, { method: "DELETE" });
  }
  createFiscalFrame(
    input: FiscalFrameInput,
  ): Promise<DataResponse<FiscalFrame>> {
    return this.request<DataResponse<FiscalFrame>>("/api/fiscal-frames", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
  updateFiscalFrame(
    id: string,
    input: Partial<FiscalFrameInput>,
  ): Promise<DataResponse<FiscalFrame>> {
    return this.request<DataResponse<FiscalFrame>>("/api/fiscal-frames/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }
  deleteFiscalFrame(id: string): Promise<void> {
    return this.request<void>("/api/fiscal-frames/" + id, { method: "DELETE" });
  }

  listFiscalFrameTaxes(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<FiscalFrameTax>> {
    return this.request<ListResponse<FiscalFrameTax>>(
      this.listPath("/api/fiscal-frame-taxes", params),
    );
  }
  createFiscalFrameTax(
    input: FiscalFrameTaxInput,
  ): Promise<DataResponse<FiscalFrameTax>> {
    return this.request<DataResponse<FiscalFrameTax>>(
      "/api/fiscal-frame-taxes",
      { method: "POST", body: JSON.stringify(input) },
    );
  }
  updateFiscalFrameTax(
    id: string,
    input: Partial<FiscalFrameTaxInput>,
  ): Promise<DataResponse<FiscalFrameTax>> {
    return this.request<DataResponse<FiscalFrameTax>>(
      "/api/fiscal-frame-taxes/" + id,
      { method: "PATCH", body: JSON.stringify(input) },
    );
  }
  deleteFiscalFrameTax(id: string): Promise<void> {
    return this.request<void>("/api/fiscal-frame-taxes/" + id, {
      method: "DELETE",
    });
  }

  listTaxRules(
    params: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<TaxRule>> {
    return this.request<ListResponse<TaxRule>>(
      this.listPath("/api/tax-rules", params),
    );
  }
  createTaxRule(input: TaxRuleInput): Promise<DataResponse<TaxRule>> {
    return this.request<DataResponse<TaxRule>>("/api/tax-rules", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
  updateTaxRule(
    id: string,
    input: Partial<TaxRuleInput>,
  ): Promise<DataResponse<TaxRule>> {
    return this.request<DataResponse<TaxRule>>("/api/tax-rules/" + id, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }
  deleteTaxRule(id: string): Promise<void> {
    return this.request<void>("/api/tax-rules/" + id, { method: "DELETE" });
  }

  private listPath(
    path: string,
    params: { limit?: number; offset?: number; search?: string; status?: string },
  ): string {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.offset !== undefined) query.set("offset", String(params.offset));
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    const serialized = query.toString();
    return serialized ? path + "?" + serialized : path;
  }

  private authRequest<T>(
    requestPath: string,
    init: RequestInit & { auth?: boolean } = {},
  ): Promise<T> {
    return this.requestFrom<T>(this.options.authBaseUrl ?? this.options.baseUrl, requestPath, init);
  }

  private async request<T>(
    requestPath: string,
    init: RequestInit & { auth?: boolean } = {},
  ): Promise<T> {
    return this.requestFrom<T>(this.options.baseUrl, requestPath, init);
  }

  private async requestFrom<T>(
    baseUrl: string,
    requestPath: string,
    init: RequestInit & { auth?: boolean } = {},
  ): Promise<T> {
    const authenticated = init.auth !== false;
    if (authenticated && shouldRefreshToken(this.options.accessToken)) {
      await this.refreshSession();
    }

    const response = await this.fetchFrom(baseUrl, requestPath, init);
    if (authenticated && response.status === 401) {
      await this.refreshSession();
      return this.parseResponse<T>(await this.fetchFrom(baseUrl, requestPath, init));
    }

    return this.parseResponse<T>(response);
  }

  private fetchFrom(
    baseUrl: string,
    requestPath: string,
    init: RequestInit & { auth?: boolean },
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    headers.set("content-type", "application/json");

    if (init.auth !== false && this.options.accessToken) {
      headers.set("authorization", "Bearer " + this.options.accessToken);
    }

    const fetchInit = { ...init };
    delete fetchInit.auth;
    return fetch(new URL(requestPath, baseUrl), {
      ...fetchInit,
      headers,
    });
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return undefined as T;

    const body = (await response.json().catch(() => ({}))) as T | ApiErrorBody;
    if (!response.ok) {
      const errorBody = body as ApiErrorBody;
      throw new Error(
        errorBody.message ??
          errorBody.reason ??
          "Request failed with " + response.status,
      );
    }

    return body as T;
  }

  private refreshSession(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;
    if (!this.options.refreshToken) {
      return Promise.reject(new Error("Missing refresh token"));
    }

    this.refreshPromise = fetch(new URL("/auth/refresh", this.options.authBaseUrl ?? this.options.baseUrl), {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: this.options.refreshToken, app: "kajar" }),
    })
      .then((response) => this.parseResponse<AuthTokenResponse>(response))
      .then((session) => {
        this.options.accessToken = session.accessToken;
        this.options.refreshToken = session.refreshToken;
        this.options.onSessionRefresh?.(session);
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }
}
