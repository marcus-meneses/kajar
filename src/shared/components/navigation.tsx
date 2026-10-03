import {
  Calculator,
  Copy,
  FileSpreadsheet,
  LayoutDashboard,
  KeyRound,
  LogOut,
  MapPinned,
  PawPrint,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { JwtPayload } from "../types";

export type AdminModule =
  | "dashboard"
  | "permissions"
  | "tokens"
  | "customers"
  | "geography"
  | "species"
  | "mirrors"
  | "fiscalCategories"
  | "taxEngine";

export const modules: Array<{
  key: AdminModule;
  label: string;
  icon: typeof ShieldCheck;
}> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "permissions", label: "Permissions", icon: ShieldCheck },
  { key: "tokens", label: "Tokens", icon: KeyRound },
  { key: "customers", label: "Customers", icon: Users },
  { key: "geography", label: "Geography", icon: MapPinned },
  { key: "species", label: "Taxonomy", icon: PawPrint },
  { key: "mirrors", label: "Mirrors", icon: Copy },
  {
    key: "fiscalCategories",
    label: "Fiscal categories",
    icon: FileSpreadsheet,
  },
  { key: "taxEngine", label: "Tax engine", icon: Calculator },
];

export function Topbar({
  user,
  onLogout,
}: {
  user: JwtPayload;
  onLogout: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <ShieldCheck size={22} aria-hidden="true" />
        <div>
          <h1>Kajar</h1>
          <span>Zeal backend administration</span>
        </div>
      </div>
      <div className="session">
        <code>
          {user.login} / {user.clearance}
        </code>
        <button
          className="icon-button"
          type="button"
          title="Sign out"
          onClick={onLogout}
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}

export function Sidebar({
  module,
  onModuleChange,
}: {
  module: AdminModule;
  onModuleChange: (module: AdminModule) => void;
}) {
  return (
    <aside className="sidebar" aria-label="Administration modules">
      <nav className="sidebar-nav">
        {modules.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={module === item.key ? "active" : ""}
              type="button"
              onClick={() => onModuleChange(item.key)}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
