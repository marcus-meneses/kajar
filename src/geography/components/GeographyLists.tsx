import React from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { RecordList, type RecordListRow } from "../../shared";

export function CountryListPane({
  rows,
  search,
  selectedId,
  onSearchChange,
  onSelect,
  onDrill,
  onLoadMore,
  loadingMore,
}: {
  rows: RecordListRow[];
  search: string;
  selectedId: string | null;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onDrill: (id: string) => void;
  onLoadMore?: () => void;
  loadingMore: boolean;
}) {
  return (
    <section className="geography-list-pane">
      <RecordList
        title="Countries"
        search={search}
        onSearchChange={onSearchChange}
        rows={rows}
        selectedId={selectedId}
        onSelect={onSelect}
        onDrill={onDrill}
        drillLabel="Show states"
        onLoadMore={onLoadMore}
        loadingMore={loadingMore}
      />
    </section>
  );
}

export function StateListWorkspace({
  rows,
  search,
  selectedId,
  emptyText,
  loadingMore,
  onSearchChange,
  onSelect,
  onDrill,
  onLoadMore,
  onBack,
  onAdd,
  children,
}: {
  rows: RecordListRow[];
  search: string;
  selectedId: string | null;
  emptyText: string;
  loadingMore: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onDrill: (id: string) => void;
  onLoadMore?: () => void;
  onBack: () => void;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="geo-workspace nested-workspace">
      <RecordList
        title="States"
        headerAction={
          <button
            className="record-header-action"
            type="button"
            title="Back to country"
            aria-label="Back to country"
            onClick={onBack}
          >
            <ArrowLeft size={16} />
          </button>
        }
        rightHeaderAction={
          <button
            className="record-header-action right"
            type="button"
            title="Add state"
            aria-label="Add state"
            onClick={onAdd}
          >
            <Plus size={16} />
          </button>
        }
        search={search}
        onSearchChange={onSearchChange}
        rows={rows}
        selectedId={selectedId}
        onSelect={onSelect}
        onDrill={onDrill}
        drillLabel="Show cities"
        emptyText={emptyText}
        onLoadMore={onLoadMore}
        loadingMore={loadingMore}
      />
      {children}
    </section>
  );
}

export function CityListWorkspace({
  rows,
  search,
  selectedId,
  emptyText,
  loadingMore,
  onSearchChange,
  onSelect,
  onLoadMore,
  onBack,
  onAdd,
  children,
}: {
  rows: RecordListRow[];
  search: string;
  selectedId: string | null;
  emptyText: string;
  loadingMore: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onLoadMore?: () => void;
  onBack: () => void;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="geo-workspace nested-workspace">
      <RecordList
        title="Cities"
        headerAction={
          <button
            className="record-header-action"
            type="button"
            title="Back to states"
            aria-label="Back to states"
            onClick={onBack}
          >
            <ArrowLeft size={16} />
          </button>
        }
        rightHeaderAction={
          <button
            className="record-header-action right"
            type="button"
            title="Add city"
            aria-label="Add city"
            onClick={onAdd}
          >
            <Plus size={16} />
          </button>
        }
        search={search}
        onSearchChange={onSearchChange}
        rows={rows}
        selectedId={selectedId}
        onSelect={onSelect}
        emptyText={emptyText}
        onLoadMore={onLoadMore}
        loadingMore={loadingMore}
      />
      {children}
    </section>
  );
}
