import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ShieldCheck } from "lucide-react";
import { ApiClient, Sidebar, Topbar, type AdminModule } from "./shared";
import { CustomersEditor } from "./customers";
import { Dashboard } from "./dashboard";
import { FiscalCategoriesEditor } from "./fiscalCategories";
import { GeographyEditor } from "./geography";
import { MirrorsEditor } from "./mirrors";
import { PermissionsEditor } from "./permissions";
import { SpeciesEditor } from "./species";
import { TaxEngineEditor } from "./taxEngine";
import { TokenManager } from "./tokens";
import type { JwtPayload } from "./shared";
import "./styles.css";
import { appConfig } from "./config/appConfig";

const tokenKey = "kajar.accessToken";
const refreshTokenKey = "kajar.refreshToken";
const permissionRevisionIntervalMs = 60_000;
localStorage.removeItem("kajar.zealUrl");
localStorage.removeItem("kajar.enhasaUrl");
type StatusState = { kind: "idle" | "ok" | "error" | "loading"; text: string };
type ErrorModalState = {
  title: string;
  message: string;
  detail?: string;
  reconnect?: boolean;
} | null;

const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as JwtPayload;
  } catch {
    return null;
  }
};

function App() {
  const zealUrl = appConfig.services.zeal.url;
  const enhasaUrl = appConfig.services.enhasa.url;
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem(tokenKey) ?? "",
  );
  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem(refreshTokenKey) ?? "",
  );
  const [status, setStatus] = useState<StatusState>({ kind: "idle", text: "" });
  const [errorModal, setErrorModal] = useState<ErrorModalState>(null);
  const [module, setModule] = useState<AdminModule>("dashboard");
  const [sessionReady, setSessionReady] = useState(false);
  const [permissionRevisionTick, setPermissionRevisionTick] = useState(0);
  const permissionCache = useRef<{ token: string; checkedAt: number; revision: number } | null>(null);

  const user = accessToken ? decodeJwt(accessToken) : null;
  const api = useMemo(
    () => new ApiClient({
      baseUrl: zealUrl,
      authBaseUrl: enhasaUrl,
      accessToken,
      refreshToken,
      onSessionRefresh: (session) => {
        localStorage.setItem(tokenKey, session.accessToken);
        localStorage.setItem(refreshTokenKey, session.refreshToken);
        setAccessToken(session.accessToken);
        setRefreshToken(session.refreshToken);
      },
    }),
    [zealUrl, enhasaUrl, accessToken, refreshToken],
  );

  useEffect(() => {
    const requestCheck = () => setPermissionRevisionTick((value) => value + 1);
    const requestCheckWhileFocused = () => {
      if (document.hasFocus()) requestCheck();
    };
    const timer = window.setInterval(requestCheckWhileFocused, permissionRevisionIntervalMs);
    window.addEventListener("focus", requestCheck);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", requestCheck);
    };
  }, []);

  useEffect(() => {
    if (!accessToken || !user) {
      permissionCache.current = null;
      setSessionReady(false);
      return;
    }

    let active = true;
    const validate = async () => {
      try {
        await api.getCurrentUser();
        const now = Date.now();
        const cached = permissionCache.current;
        if (cached?.token === accessToken && now - cached.checkedAt < permissionRevisionIntervalMs) {
          if (active) setSessionReady(true);
          return;
        }

        const revision = await api.getPermissionRevision();
        if (cached?.token === accessToken && cached.revision === revision.data.revision) {
          permissionCache.current = { ...cached, checkedAt: now };
        } else {
          const response = await api.getPermissionAccessMap();
          permissionCache.current = {
            token: accessToken,
            checkedAt: now,
            revision: response.data.revision,
          };
        }
        if (active) setSessionReady(true);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Session validation failed.";
        if (/invalid or expired token|refresh token|missing or invalid authorization|authentication required|unauthorized|missing refresh token/i.test(message)) {
          localStorage.removeItem(tokenKey);
          localStorage.removeItem(refreshTokenKey);
          permissionCache.current = null;
          setAccessToken("");
          setRefreshToken("");
          setSessionReady(false);
          return;
        }
        setSessionReady(false);
        setErrorModal((current) => current ?? {
          title: "Could not validate session",
          message,
          reconnect: false,
        });
      }
    };

    void validate();
    return () => {
      active = false;
    };
  }, [accessToken, api, module, permissionRevisionTick, user?.sub]);

  const showRequestError = (
    title: string,
    error: unknown,
    fallback: string,
  ) => {
    const message =
      error instanceof Error && error.message ? error.message : fallback;
    const reconnect =
      /invalid or expired token|missing or invalid authorization|authentication required|unauthorized/i.test(
        message,
      );
    setStatus({ kind: "error", text: fallback });
    setErrorModal({ title, message, reconnect });
  };

  const reconnect = () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshTokenKey);
    setAccessToken("");
    setRefreshToken("");
    setErrorModal(null);
    setStatus({ kind: "idle", text: "" });
    permissionCache.current = null;
    setSessionReady(false);
  };

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextApi = new ApiClient({ baseUrl: zealUrl, authBaseUrl: enhasaUrl });
    setStatus({ kind: "loading", text: "Signing in..." });
    try {
      const response = await nextApi.login({
        login: String(form.get("login") ?? ""),
        email: String(form.get("email") || "") || undefined,
        password: String(form.get("password") ?? ""),
        app: "kajar",
      });
      localStorage.setItem(tokenKey, response.accessToken);
      localStorage.setItem(refreshTokenKey, response.refreshToken);
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setStatus({ kind: "idle", text: "" });
    } catch (error) {
      showRequestError("Login failed", error, "Login failed.");
    }
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshTokenKey);
    setAccessToken("");
    setRefreshToken("");
    setStatus({ kind: "idle", text: "" });
    permissionCache.current = null;
    setSessionReady(false);
  };

  if (!accessToken || !user) {
    return (
      <>
        <LoginScreen onLogin={login} status={status} />
        <ErrorModal
          error={errorModal}
          onClose={() => setErrorModal(null)}
          onReconnect={reconnect}
        />
      </>
    );
  }

  if (!sessionReady) {
    return (
      <div className="shell">
        <Topbar user={user} onLogout={logout} />
        <main className="main">
          <div className="status loading">Validating session and permissions...</div>
        </main>
        <ErrorModal error={errorModal} onClose={() => setErrorModal(null)} onReconnect={reconnect} />
      </div>
    );
  }

  return (
    <div className="shell">
      <Topbar user={user} onLogout={logout} />

      <div className="app-frame">
        <Sidebar module={module} onModuleChange={setModule} />
        <main className="main">
          {module === "dashboard" ? (
            <Dashboard api={api} onRequestError={showRequestError} />
          ) : module === "permissions" ? (
            <PermissionsEditor api={api} onRequestError={showRequestError} />
          ) : module === "tokens" ? (
            <TokenManager api={api} onRequestError={showRequestError} />
          ) : module === "customers" ? (
            <CustomersEditor api={api} onRequestError={showRequestError} />
          ) : module === "geography" ? (
            <GeographyEditor api={api} onRequestError={showRequestError} />
          ) : module === "species" ? (
            <SpeciesEditor api={api} onRequestError={showRequestError} />
          ) : module === "mirrors" ? (
            <MirrorsEditor api={api} onRequestError={showRequestError} />
          ) : module === "fiscalCategories" ? (
            <FiscalCategoriesEditor
              api={api}
              onRequestError={showRequestError}
            />
          ) : (
            <TaxEngineEditor api={api} onRequestError={showRequestError} />
          )}
        </main>
      </div>
      <ErrorModal
        error={errorModal}
        onClose={() => setErrorModal(null)}
        onReconnect={reconnect}
      />
    </div>
  );
}

function LoginScreen({
  onLogin,
  status,
}: {
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
  status: StatusState;
}) {
  return (
    <div className="login-page">
      <section className="login-panel">
        <div className="login-title">
          <ShieldCheck size={26} aria-hidden="true" />
          <div>
            <h1>Kajar</h1>
            <p>Zeal backend administration</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={onLogin}>
          <label>
            Login
            <input
              name="login"
              defaultValue="admin"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Email
            <input
              name="email"
              defaultValue="admin@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <Status status={status} />
          <button className="primary-button" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </div>
  );
}

function Status({ status }: { status: StatusState }) {
  if (!status.text) return null;
  return <div className={"status " + status.kind}>{status.text}</div>;
}

function ErrorModal({
  error,
  onClose,
  onReconnect,
}: {
  error: ErrorModalState;
  onClose: () => void;
  onReconnect: () => void;
}) {
  if (!error) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <h2 id="error-modal-title">{error.title}</h2>
        </header>
        <div className="modal-body">
          <p>{error.message}</p>
          {error.detail && <pre>{error.detail}</pre>}
        </div>
        <footer className="modal-actions">
          {error.reconnect && (
            <button
              className="primary-button"
              type="button"
              autoFocus
              onClick={onReconnect}
            >
              Reconnect
            </button>
          )}
          <button
            className={error.reconnect ? "secondary-button" : "primary-button"}
            type="button"
            autoFocus={!error.reconnect}
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
