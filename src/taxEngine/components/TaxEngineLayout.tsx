import React from "react";
import { RefreshCw } from "lucide-react";
import { Metric, RecordList } from "../../shared";

export type TaxEngineTab =
  | "policies"
  | "rules"
  | "frames"
  | "frameTaxes";
export type TaxEngineTabConfig = {
  key: TaxEngineTab;
  title: string;
  listTitle: string;
  metric: string;
};
export type TaxEngineRow = { id: string; primary: string; secondary: string };

export function TaxEngineSummary({
  rules,
  policies,
  frames,
  frameTaxes,
  onRefresh,
}: {
  rules: number;
  policies: number;
  frames: number;
  frameTaxes: number;
  onRefresh: () => void;
}) {
  return (
    <section className="summary" aria-label="Tax engine summary">
      <Metric value={rules} label="Rules" />
      <Metric value={policies} label="Policy sets" />
      <Metric value={frames} label="Frames" />
      <Metric value={frameTaxes} label="Frame taxes" />
      <button
        className="metric-action secondary"
        type="button"
        onClick={onRefresh}
      >
        <RefreshCw size={17} />
        Refresh data
      </button>
    </section>
  );
}

export function TaxEngineTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TaxEngineTabConfig[];
  active: TaxEngineTab;
  onChange: (tab: TaxEngineTab) => void;
}) {
  return (
    <nav className="subtabs" aria-label="Tax engine sections">
      {tabs.map((item) => (
        <button
          key={item.key}
          className={active === item.key ? "active" : ""}
          type="button"
          onClick={() => onChange(item.key)}
        >
          {item.title}
        </button>
      ))}
    </nav>
  );
}

export function TaxEngineWorkspace({
  title,
  search,
  rows,
  selectedId,
  onSearchChange,
  onSelect,
  children,
}: {
  title: string;
  search: string;
  rows: TaxEngineRow[];
  selectedId: string | null;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="geo-workspace">
      <RecordList
        title={title}
        search={search}
        onSearchChange={onSearchChange}
        rows={rows}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <aside className="editor">{children}</aside>
    </section>
  );
}
