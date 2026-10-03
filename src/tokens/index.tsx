import React, { useEffect, useMemo, useState } from "react";
import { Ban, KeyRound, RefreshCw, Search } from "lucide-react";
import { Metric, Status } from "../shared";
import type { ApiClient, AuthRefreshToken, AuthTokenSummary, StatusState } from "../shared";

type RequestErrorHandler = (
  title: string,
  error: unknown,
  fallback: string,
) => void;

type TokenStatusFilter = "all" | "active" | "expired" | "revoked";

const pageSize = 100;

const tokenState = (token: AuthRefreshToken): "active" | "expired" | "revoked" => {
  if (token.revokedAt) return "revoked";
  return new Date(token.expiresAt).getTime() <= Date.now() ? "expired" : "active";
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const tokenOwner = (token: AuthRefreshToken) =>
  token.userLogin || token.userEmail || token.userName || token.userId;

export function TokenManager({
  api,
  onRequestError,
}: {
  api: ApiClient;
  onRequestError: RequestErrorHandler;
}) {
  const [tokens, setTokens] = useState<AuthRefreshToken[]>([]);
  const [summary, setSummary] = useState<AuthTokenSummary>({
    total: 0,
    active: 0,
    expired: 0,
    revoked: 0,
  });
  const [status, setStatus] = useState<StatusState>({ kind: "idle", text: "" });
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TokenStatusFilter>("all");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const canLoadPrevious = offset > 0;
  const canLoadNext = offset + tokens.length < total;

  const load = async (nextOffset = offset) => {
    setLoading(true);
    setStatus({ kind: "loading", text: "Loading auth tokens..." });
    try {
      const [tokenResponse, summaryResponse] = await Promise.all([
        api.listAuthTokens({
          limit: pageSize,
          offset: nextOffset,
          search: appliedSearch,
          status: statusFilter,
        }),
        api.getAuthTokenSummary(),
      ]);
      setTokens(tokenResponse.data);
      setTotal(tokenResponse.count);
      setSummary(summaryResponse.data);
      setOffset(nextOffset);
      setStatus({ kind: "ok", text: "Auth tokens loaded." });
    } catch (error) {
      setStatus({ kind: "error", text: "Could not load auth tokens." });
      onRequestError("Could not load auth tokens", error, "Could not load auth tokens.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(0);
  }, [appliedSearch, statusFilter]);

  const revoke = async (token: AuthRefreshToken) => {
    if (token.revokedAt) return;
    const confirmed = window.confirm("Delete this refresh token? The user will need to sign in again after the current access token expires.");
    if (!confirmed) return;

    setSavingId(token.id);
    try {
      await api.revokeAuthToken(token.id);
      setTokens((current) => current.filter((item) => item.id !== token.id));
      setTotal((current) => Math.max(0, current - 1));
      const summaryResponse = await api.getAuthTokenSummary();
      setSummary(summaryResponse.data);
      setStatus({ kind: "ok", text: "Token deleted." });
    } catch (error) {
      setStatus({ kind: "error", text: "Could not delete token." });
      onRequestError("Could not delete token", error, "Could not delete token.");
    } finally {
      setSavingId(null);
    }
  };

  const rows = useMemo(() => tokens.map((token) => ({ token, state: tokenState(token) })), [tokens]);

  return (
    <section className="token-manager">
      <header className="dashboard-head">
        <div>
          <h2>Token management</h2>
          <span>Refresh token visibility and revocation for Zeal authentication</span>
        </div>
        <button className="secondary-button" type="button" disabled={loading} onClick={() => void load(offset)}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <section className="summary" aria-label="Token summary">
        <Metric value={summary.total} label="Total tokens" />
        <Metric value={summary.active} label="Active" />
        <Metric value={summary.expired} label="Expired" />
        <Metric value={summary.revoked} label="Revoked" />
      </section>

      <Status status={status} />

      <section className="route-list-controls token-controls">
        <label className="search-field geo-search">
          <Search size={16} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setAppliedSearch(search.trim());
            }}
            placeholder="Search login, email, user id, or token id"
          />
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TokenStatusFilter)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
        </label>
        <button className="primary-button" type="button" onClick={() => setAppliedSearch(search.trim())}>
          <Search size={16} />
          Search
        </button>
      </section>

      <section className="table-panel token-table" aria-label="Auth refresh tokens">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>User</th>
              <th>App</th>
              <th>Status</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ token, state }) => (
              <tr key={token.id}>
                <td>
                  <div className="route-path">#{token.numericId} {token.tokenHashPreview}</div>
                  <div className="route-description">{token.id}</div>
                </td>
                <td>
                  <strong>{tokenOwner(token)}</strong>
                  <div className="route-description">{token.userEmail || token.userCustomerId || token.userStatus || token.userId}</div>
                </td>
                <td><span className="badge">{token.app}</span></td>
                <td>
                  <span className={"badge token-state " + state}>{state}</span>
                  {token.revokedAt && <div className="route-description">Revoked {formatDateTime(token.revokedAt)}</div>}
                </td>
                <td>{formatDateTime(token.createdAt)}</td>
                <td>{formatDateTime(token.expiresAt)}</td>
                <td>
                  <button
                    className="danger-button compact-button"
                    type="button"
                    disabled={Boolean(token.revokedAt) || savingId === token.id}
                    onClick={() => void revoke(token)}
                  >
                    {token.revokedAt ? <KeyRound size={15} /> : <Ban size={15} />}
                    {token.revokedAt ? "Revoked" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state geo-empty">No auth tokens match the current filters.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <footer className="token-pagination">
        <span>{total ? `${offset + 1}-${offset + tokens.length} of ${total}` : "0 tokens"}</span>
        <div>
          <button className="secondary-button" type="button" disabled={!canLoadPrevious || loading} onClick={() => void load(Math.max(0, offset - pageSize))}>
            Previous
          </button>
          <button className="secondary-button" type="button" disabled={!canLoadNext || loading} onClick={() => void load(offset + pageSize)}>
            Next
          </button>
        </div>
      </footer>
    </section>
  );
}
