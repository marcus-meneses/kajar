type ServiceConfig = Readonly<{ url: string }>;
type RuntimeConfig = {
  app?: { environment?: string; publicUrl?: string };
  services?: { zeal?: { url?: string }; enhasa?: { url?: string } };
};

declare global {
  interface Window { __APP_CONFIG__?: RuntimeConfig }
}

const normalizeUrl = (value: string, name: string): string => {
  try { return new URL(value).toString().replace(/\/$/, ""); }
  catch { throw new Error(`Invalid ${name}: ${value}`); }
};
const required = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`Missing Kajar service configuration: ${name}`);
  return normalizeUrl(value, name);
};

const runtime = typeof window === "undefined" ? undefined : window.__APP_CONFIG__;
const localZeal = import.meta.env.DEV ? "http://localhost:3000" : undefined;
const localEnhasa = import.meta.env.DEV ? "http://localhost:3001" : undefined;

export const appConfig = Object.freeze({
  app: Object.freeze({
    environment: runtime?.app?.environment ?? import.meta.env.MODE,
    publicUrl: runtime?.app?.publicUrl ?? (typeof window === "undefined" ? "" : window.location.origin),
  }),
  services: Object.freeze({
    zeal: Object.freeze<ServiceConfig>({ url: required(runtime?.services?.zeal?.url ?? import.meta.env.VITE_SERVICE_ZEAL_URL ?? import.meta.env.VITE_ZEAL_URL ?? localZeal, "services.zeal.url") }),
    enhasa: Object.freeze<ServiceConfig>({ url: required(runtime?.services?.enhasa?.url ?? import.meta.env.VITE_SERVICE_ENHASA_URL ?? import.meta.env.VITE_ENHASA_URL ?? localEnhasa, "services.enhasa.url") }),
  }),
});
