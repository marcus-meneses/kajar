import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import type { ApiClient } from "../shared";
import {
  CustomerForm,
  CustomerRecordList as RecordList,
  EmployeeForm,
  UserForm,
} from "./components";
import {
  Metric,
  Status,
  EmptyState,
  type Customer,
  type CustomerInput,
  type DictionaryCollection,
  type Employee,
  type EmployeeInput,
  type User,
  type UserInput,
} from "../shared";

type StatusState = { kind: "idle" | "ok" | "error" | "loading"; text: string };
type RequestErrorHandler = (
  title: string,
  error: unknown,
  fallback: string,
) => void;
type CustomerTab = "customer" | "employees" | "user";
type Row = {
  id: string;
  primary: string;
  secondary: string;
  actionLabel?: string;
};

const PAGE_SIZE = 30;

const blankCustomer = (): CustomerInput => ({
  cityId: "",
  contactUserId: null,
  fiscalName: "",
  enterpriseSize: "ME",
  enterpriseType: "LTDA",
  taxRegime: "SIMPLES",
  timezone: "UTC-03",
  name: null,
  cnpj: null,
  email: null,
  phone: null,
  address: null,
  cep: null,
  discount: null,
  stateSubscription: null,
  status: "active",
});
const blankEmployee = (customerId = ""): EmployeeInput => ({
  customerId,
  type: "OUT",
  fullName: "",
  commissionEnabled: false,
  displayName: "",
  cpf: null,
  email: null,
  phone: null,
  status: "active",
  hiredAt: null,
  terminatedAt: null,
  canLogin: false,
  notes: null,
});
const blankUser = (customerId = "", employeeId = ""): UserInput => ({
  customerId,
  employeeId,
  name: null,
  cpf: null,
  email: null,
  phone: null,
  login: null,
  passwordSHA256: null,
  status: "active",
});

const fetchAllPages = async <T,>(
  fetchPage: (params: {
    limit: number;
    offset: number;
  }) => Promise<{ data: T[] }>,
): Promise<T[]> => {
  const limit = 500;
  const records: T[] = [];
  for (let offset = 0; ; offset += limit) {
    const page = await fetchPage({ limit, offset });
    records.push(...page.data);
    if (page.data.length < limit) return records;
  }
};

export function CustomersEditor({
  api,
  onRequestError,
}: {
  api: ApiClient;
  onRequestError: RequestErrorHandler;
}) {
  const [tab, setTab] = useState<CustomerTab>("customer");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [customerOffset, setCustomerOffset] = useState(0);
  const [customerHasMore, setCustomerHasMore] = useState(true);
  const [customerLoadingMore, setCustomerLoadingMore] = useState(false);
  const customerLoadingRef = useRef(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [customerDraft, setCustomerDraft] =
    useState<CustomerInput>(blankCustomer);
  const [employeeDraft, setEmployeeDraft] =
    useState<EmployeeInput>(blankEmployee);
  const [userDraft, setUserDraft] = useState<UserInput>(blankUser);
  const [customerSearch, setCustomerSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [status, setStatus] = useState<StatusState>({ kind: "idle", text: "" });
  const [saving, setSaving] = useState(false);
  const [dictionaries, setDictionaries] = useState<DictionaryCollection>({});

  const selectedCustomer =
    customers.find((item) => item.id === selectedCustomerId) ?? null;
  const customerEmployees = useMemo(
    () => employees.filter((item) => item.customerId === selectedCustomerId),
    [employees, selectedCustomerId],
  );
  const customerUsers = useMemo(
    () => users.filter((item) => item.customerId === selectedCustomerId),
    [users, selectedCustomerId],
  );
  const userByEmployeeId = useMemo(
    () => new Map(customerUsers.map((item) => [item.employeeId, item])),
    [customerUsers],
  );

  const loadCustomersPage = async (reset = false): Promise<void> => {
    if (customerLoadingRef.current) return;
    customerLoadingRef.current = true;
    const offset = reset ? 0 : customerOffset;
    setCustomerLoadingMore(true);
    if (reset) setStatus({ kind: "loading", text: "Loading customers..." });
    try {
      const [countResponse, page] = await Promise.all([
        reset
          ? api.countCustomers()
          : Promise.resolve({ count: customerCount }),
        api.listCustomers({ limit: PAGE_SIZE, offset }),
      ]);
      const nextCustomers = reset
        ? sortCustomers(page.data)
        : sortCustomers([
            ...customers,
            ...page.data.filter(
              (item) => !customers.some((current) => current.id === item.id),
            ),
          ]);
      const nextOffset = offset + page.data.length;
      setCustomerCount(countResponse.count);
      setCustomers(nextCustomers);
      setCustomerOffset(nextOffset);
      setCustomerHasMore(
        page.data.length === PAGE_SIZE && nextOffset < countResponse.count,
      );
      if (reset) {
        setEmployees([]);
        setUsers([]);
        const nextCustomer = selectedCustomerId
          ? nextCustomers.find((item) => item.id === selectedCustomerId)
          : nextCustomers[0];
        if (nextCustomer) selectCustomer(nextCustomer, [], []);
        else resetSelection();
        setStatus({
          kind: "ok",
          text:
            "Loaded " +
            nextCustomers.length +
            " of " +
            countResponse.count +
            " customers.",
        });
      }
    } catch (error) {
      setStatus({ kind: "error", text: "Could not load customer records." });
      onRequestError(
        "Could not load customer records",
        error,
        "Could not load customers.",
      );
    } finally {
      customerLoadingRef.current = false;
      setCustomerLoadingMore(false);
    }
  };

  const loadCustomerRelations = async (customerId: string): Promise<void> => {
    setStatus({ kind: "loading", text: "Loading employees and users..." });
    try {
      const [employeeRecords, userRecords] = await Promise.all([
        fetchAllPages((params) =>
          api.listEmployeesByCustomer(customerId, params),
        ),
        fetchAllPages((params) => api.listUsersByCustomer(customerId, params)),
      ]);
      setEmployees(sortEmployees(employeeRecords));
      setUsers(sortUsers(userRecords));
      clearEmployeeSelection(customerId);
      setStatus({ kind: "ok", text: "Loaded customer employees and users." });
    } catch (error) {
      setStatus({
        kind: "error",
        text: "Could not load customer employees and users.",
      });
      onRequestError(
        "Could not load customer employees and users",
        error,
        "Could not load customer employees and users.",
      );
    }
  };

  const loadDictionaries = async (): Promise<void> => {
    try {
      const response = await api.listDictionaries();
      setDictionaries(response.data);
    } catch (error) {
      onRequestError(
        "Could not load dictionaries",
        error,
        "Could not load dictionaries.",
      );
    }
  };

  const load = async () => {
    await Promise.all([loadDictionaries(), loadCustomersPage(true)]);
  };

  useEffect(() => {
    void load();
  }, []);

  const resetSelection = () => {
    setSelectedCustomerId(null);
    setSelectedEmployeeId(null);
    setSelectedUserId(null);
    setCustomerDraft(blankCustomer());
    setEmployeeDraft(blankEmployee());
    setUserDraft(blankUser());
  };

  const selectCustomer = (
    customer: Customer,
    employeeSource = employees,
    userSource = users,
  ) => {
    setSelectedCustomerId(customer.id);
    setCustomerDraft(customerToInput(customer));
    const scopedEmployees = employeeSource
      .filter((item) => item.customerId === customer.id)
      .sort((left, right) => left.fullName.localeCompare(right.fullName));
    const scopedUsers = userSource
      .filter((item) => item.customerId === customer.id)
      .sort((left, right) => userLabel(left).localeCompare(userLabel(right)));
    const nextEmployee = scopedEmployees[0] ?? null;
    const nextUser = nextEmployee
      ? (scopedUsers.find((item) => item.employeeId === nextEmployee.id) ??
        null)
      : null;
    setSelectedEmployeeId(nextEmployee?.id ?? null);
    setSelectedUserId(nextUser?.id ?? null);
    setEmployeeDraft(
      nextEmployee ? employeeToInput(nextEmployee) : blankEmployee(customer.id),
    );
    setUserDraft(
      nextUser
        ? userToInput(nextUser)
        : blankUser(customer.id, nextEmployee?.id ?? ""),
    );
  };

  const newCustomer = () => {
    setSelectedCustomerId(null);
    setSelectedEmployeeId(null);
    setSelectedUserId(null);
    setCustomerDraft(blankCustomer());
    setEmployeeDraft(blankEmployee());
    setUserDraft(blankUser());
    setTab("customer");
  };
  const returnToCustomers = () => {
    setSelectedEmployeeId(null);
    setSelectedUserId(null);
    setEmployeeDraft(blankEmployee(selectedCustomerId ?? ""));
    setUserDraft(blankUser(selectedCustomerId ?? "", ""));
    setTab("customer");
  };
  const clearEmployeeSelection = (customerId = selectedCustomerId ?? "") => {
    setSelectedEmployeeId(null);
    setSelectedUserId(null);
    setEmployeeDraft(blankEmployee(customerId));
    setUserDraft(blankUser(customerId, ""));
  };
  const newEmployee = () => {
    clearEmployeeSelection();
    setTab("employees");
  };
  const newUser = (employeeId = "") => {
    const customerId = selectedCustomerId ?? "";
    setSelectedUserId(null);
    setUserDraft(blankUser(customerId, employeeId));
    setTab("user");
  };

  const saveCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = normalizeCustomer(customerDraft);
    setSaving(true);
    try {
      const response = selectedCustomerId
        ? await api.updateCustomer(selectedCustomerId, input)
        : await api.createCustomer(input);
      setCustomers((current) =>
        sortCustomers(
          selectedCustomerId
            ? current.map((item) =>
                item.id === selectedCustomerId ? response.data : item,
              )
            : [...current, response.data],
        ),
      );
      setSelectedCustomerId(response.data.id);
      setCustomerDraft(customerToInput(response.data));
      setStatus({
        kind: "ok",
        text: selectedCustomerId ? "Customer updated." : "Customer created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save customer",
        error,
        "Could not save customer.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = normalizeEmployee({
      ...employeeDraft,
      customerId: selectedCustomerId ?? employeeDraft.customerId,
    });
    setSaving(true);
    try {
      const response = selectedEmployeeId
        ? await api.updateEmployee(selectedEmployeeId, input)
        : await api.createEmployee(input);
      setEmployees((current) =>
        sortEmployees(
          selectedEmployeeId
            ? current.map((item) =>
                item.id === selectedEmployeeId ? response.data : item,
              )
            : [...current, response.data],
        ),
      );
      setSelectedEmployeeId(response.data.id);
      setEmployeeDraft(employeeToInput(response.data));
      setStatus({
        kind: "ok",
        text: selectedEmployeeId ? "Employee updated." : "Employee created.",
      });
    } catch (error) {
      onRequestError(
        "Could not save employee",
        error,
        "Could not save employee.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEmployeeId) {
      setStatus({
        kind: "error",
        text: "Select an employee before saving a user.",
      });
      return;
    }
    const input = normalizeUser({
      ...userDraft,
      customerId: selectedCustomerId ?? userDraft.customerId,
      employeeId: selectedEmployeeId,
    });
    setSaving(true);
    try {
      const response = selectedUserId
        ? await api.updateUser(selectedUserId, input)
        : await api.createUser(input);
      setUsers((current) =>
        sortUsers(
          selectedUserId
            ? current.map((item) =>
                item.id === selectedUserId ? response.data : item,
              )
            : [...current, response.data],
        ),
      );
      setSelectedUserId(response.data.id);
      setUserDraft(userToInput(response.data));
      setTab("user");
      setStatus({
        kind: "ok",
        text: selectedUserId ? "User updated." : "User created.",
      });
    } catch (error) {
      onRequestError("Could not save user", error, "Could not save user.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async () => {
    if (
      !selectedCustomerId ||
      !window.confirm("Flag this customer as deleted?")
    )
      return;
    setSaving(true);
    try {
      await api.deleteCustomer(selectedCustomerId);
      setCustomers((current) =>
        current.filter((item) => item.id !== selectedCustomerId),
      );
      resetSelection();
      setStatus({ kind: "ok", text: "Customer flagged as deleted." });
    } catch (error) {
      onRequestError(
        "Could not delete customer",
        error,
        "Could not delete customer.",
      );
    } finally {
      setSaving(false);
    }
  };
  const deleteEmployee = async () => {
    if (
      !selectedEmployeeId ||
      !window.confirm("Flag this employee as deleted?")
    )
      return;
    setSaving(true);
    try {
      await api.deleteEmployee(selectedEmployeeId);
      setEmployees((current) =>
        current.filter((item) => item.id !== selectedEmployeeId),
      );
      newEmployee();
      setStatus({ kind: "ok", text: "Employee flagged as deleted." });
    } catch (error) {
      onRequestError(
        "Could not delete employee",
        error,
        "Could not delete employee.",
      );
    } finally {
      setSaving(false);
    }
  };
  const deleteUser = async () => {
    if (!selectedUserId || !window.confirm("Flag this user as deleted?"))
      return;
    setSaving(true);
    try {
      await api.deleteUser(selectedUserId);
      setUsers((current) =>
        current.filter((item) => item.id !== selectedUserId),
      );
      newUser();
      setStatus({ kind: "ok", text: "User flagged as deleted." });
    } catch (error) {
      onRequestError("Could not delete user", error, "Could not delete user.");
    } finally {
      setSaving(false);
    }
  };

  const customerRows = filterRows(
    customers.map((item) => ({
      id: item.id,
      primary: customerName(item),
      secondary: [item.fiscalName, item.status, item.cnpj]
        .filter(Boolean)
        .join(" / "),
    })),
    customerSearch,
  );

  const openCustomerEmployees = async (id: string): Promise<void> => {
    const customer = customers.find((item) => item.id === id);
    if (!customer) return;
    selectCustomer(customer, [], []);
    clearEmployeeSelection(customer.id);
    setTab("employees");
    await loadCustomerRelations(customer.id);
  };
  const employeeRows = filterRows(
    customerEmployees.map((item) => ({
      id: item.id,
      primary: item.fullName,
      secondary: [
        item.type,
        item.status,
        userByEmployeeId.has(item.id) ? "has user" : "no user",
      ].join(" / "),
      actionLabel: userByEmployeeId.has(item.id) ? "Edit user" : "Add user",
    })),
    employeeSearch,
  );

  return (
    <>
      <section className="summary" aria-label="Customer summary">
        <Metric value={customerCount} label="Customers" />
        <Metric value={customerEmployees.length} label="Employees" />
        <Metric value={customerUsers.length} label="Users" />
        <button
          className="metric-action secondary"
          type="button"
          onClick={() => void load()}
        >
          <RefreshCw size={17} />
          Refresh data
        </button>
        <button className="metric-action" type="button" onClick={newCustomer}>
          <Plus size={17} />
          New customer
        </button>
      </section>
      <Status status={status} />
      <section className="geo-workspace customers-workspace">
        <section className="customer-list-pane">
          <RecordList
            title="Customers"
            search={customerSearch}
            onSearchChange={setCustomerSearch}
            rows={customerRows}
            selectedId={selectedCustomerId}
            onSelect={(id) => {
              const customer = customers.find((item) => item.id === id);
              if (customer) {
                selectCustomer(customer, [], []);
                setTab("customer");
              }
            }}
            drillLabel="Open employees"
            drillIcon="arrow"
            onDrill={(id) => {
              void openCustomerEmployees(id);
            }}
            onLoadMore={
              customerHasMore
                ? () => {
                    void loadCustomersPage(false);
                  }
                : undefined
            }
            loadingMore={customerLoadingMore}
          />
        </section>
        <section className="customer-detail">
          {tab === "customer" ? (
            <aside className="editor customer-editor">
              <CustomerForm
                api={api}
                selectedCustomerId={selectedCustomerId}
                draft={customerDraft}
                selectedId={selectedCustomerId}
                saving={saving}
                dictionaries={dictionaries}
                onRequestError={onRequestError}
                onDraft={setCustomerDraft}
                onSubmit={saveCustomer}
                onNew={newCustomer}
                onDelete={deleteCustomer}
              />
            </aside>
          ) : !selectedCustomer ? (
            <EmptyState text="Select a customer before managing employees or users." />
          ) : (
            <section className="geo-workspace nested-workspace">
              <RecordList
                title="Employees"
                headerAction={
                  <button
                    className="record-header-action"
                    type="button"
                    title="Back to customers"
                    aria-label="Back to customers"
                    onClick={returnToCustomers}
                  >
                    <ArrowLeft size={16} />
                  </button>
                }
                rightHeaderAction={
                  <button
                    className="record-header-action right"
                    type="button"
                    title="Add employee"
                    aria-label="Add employee"
                    onClick={newEmployee}
                  >
                    <Plus size={16} />
                  </button>
                }
                search={employeeSearch}
                onSearchChange={setEmployeeSearch}
                rows={employeeRows}
                selectedId={selectedEmployeeId}
                onSelect={(id) => {
                  const employee = employees.find((item) => item.id === id);
                  if (employee) {
                    setSelectedEmployeeId(id);
                    setEmployeeDraft(employeeToInput(employee));
                    setTab("employees");
                  }
                }}
                drillLabel="Manage user"
                onDrill={(id) => {
                  const employee = employees.find((item) => item.id === id);
                  if (employee) {
                    setSelectedEmployeeId(id);
                    setEmployeeDraft(employeeToInput(employee));
                  }
                  const existing = userByEmployeeId.get(id);
                  if (existing) {
                    setSelectedUserId(existing.id);
                    setUserDraft(userToInput(existing));
                    setTab("user");
                  } else newUser(id);
                }}
              />
              {tab === "user" ? (
                <aside className="editor">
                  <UserForm
                    draft={userDraft}
                    employee={
                      customerEmployees.find(
                        (item) => item.id === selectedEmployeeId,
                      ) ?? null
                    }
                    selectedId={selectedUserId}
                    saving={saving}
                    onDraft={setUserDraft}
                    onSubmit={saveUser}
                    onNew={() => newUser(selectedEmployeeId ?? "")}
                    onDelete={deleteUser}
                  />
                </aside>
              ) : (
                <aside className="editor">
                  <EmployeeForm
                    draft={employeeDraft}
                    selectedId={selectedEmployeeId}
                    saving={saving}
                    onDraft={setEmployeeDraft}
                    onSubmit={saveEmployee}
                    onNew={newEmployee}
                    onDelete={deleteEmployee}
                  />
                </aside>
              )}
            </section>
          )}
        </section>
      </section>
    </>
  );
}

function customerName(item: Customer): string {
  return item.name || item.fiscalName || item.id;
}
function userLabel(item: User): string {
  return [item.name || item.login || "Unnamed user", item.email]
    .filter(Boolean)
    .join(" - ");
}
function sortCustomers(items: Customer[]): Customer[] {
  return [...items].sort((left, right) =>
    customerName(left).localeCompare(customerName(right)),
  );
}
function sortEmployees(items: Employee[]): Employee[] {
  return [...items].sort((left, right) =>
    left.fullName.localeCompare(right.fullName),
  );
}
function sortUsers(items: User[]): User[] {
  return [...items].sort((left, right) =>
    userLabel(left).localeCompare(userLabel(right)),
  );
}
function filterRows(rows: Row[], query: string): Row[] {
  const needle = query.trim().toLowerCase();
  return needle
    ? rows.filter((row) =>
        [row.primary, row.secondary].some((value) =>
          value.toLowerCase().includes(needle),
        ),
      )
    : rows;
}
function cleanText(value: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}
function requiredText(value: string | null): string {
  return cleanText(value) ?? "";
}
function nullableNumber(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function customerToInput(item: Customer): CustomerInput {
  return {
    cityId: item.cityId,
    contactUserId: item.contactUserId,
    fiscalName: item.fiscalName,
    enterpriseSize: item.enterpriseSize,
    enterpriseType: item.enterpriseType,
    taxRegime: item.taxRegime,
    timezone: item.timezone,
    name: item.name,
    cnpj: item.cnpj,
    email: item.email,
    phone: item.phone,
    address: item.address,
    cep: item.cep,
    discount: item.discount,
    stateSubscription: item.stateSubscription,
    status: item.status,
  };
}
function employeeToInput(item: Employee): EmployeeInput {
  return {
    customerId: item.customerId,
    type: item.type,
    fullName: item.fullName,
    commissionEnabled: item.commissionEnabled,
    displayName: item.displayName,
    cpf: item.cpf,
    email: item.email,
    phone: item.phone,
    status: item.status,
    hiredAt: item.hiredAt,
    terminatedAt: item.terminatedAt,
    canLogin: item.canLogin,
    notes: item.notes,
  };
}
function userToInput(item: User): UserInput {
  return {
    customerId: item.customerId,
    employeeId: item.employeeId,
    name: item.name,
    cpf: item.cpf,
    email: item.email,
    phone: item.phone,
    login: item.login,
    passwordSHA256: item.passwordSHA256,
    status: item.status,
  };
}
function normalizeCustomer(input: CustomerInput): CustomerInput {
  return {
    ...input,
    cityId: requiredText(input.cityId),
    contactUserId: cleanText(input.contactUserId),
    fiscalName: requiredText(input.fiscalName),
    enterpriseSize: requiredText(input.enterpriseSize),
    enterpriseType: requiredText(input.enterpriseType),
    taxRegime: requiredText(input.taxRegime),
    timezone: requiredText(input.timezone),
    name: cleanText(input.name),
    cnpj: cleanText(input.cnpj),
    email: cleanText(input.email),
    phone: cleanText(input.phone),
    address: cleanText(input.address),
    cep: cleanText(input.cep),
    discount: nullableNumber(input.discount),
    stateSubscription: cleanText(input.stateSubscription),
  };
}
function normalizeEmployee(input: EmployeeInput): EmployeeInput {
  return {
    ...input,
    customerId: requiredText(input.customerId),
    fullName: requiredText(input.fullName),
    displayName: requiredText(input.displayName),
    cpf: cleanText(input.cpf),
    email: cleanText(input.email),
    phone: cleanText(input.phone),
    hiredAt: cleanText(input.hiredAt),
    terminatedAt: cleanText(input.terminatedAt),
    notes: cleanText(input.notes),
  };
}
function normalizeUser(input: UserInput): UserInput {
  return {
    ...input,
    customerId: requiredText(input.customerId),
    employeeId: requiredText(input.employeeId),
    name: cleanText(input.name),
    cpf: cleanText(input.cpf),
    email: cleanText(input.email),
    phone: cleanText(input.phone),
    login: cleanText(input.login),
    passwordSHA256: cleanText(input.passwordSHA256),
  };
}
