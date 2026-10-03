import React from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { RecordList, type RecordListRow } from "../../shared";

export function SpeciesListPane({
  rows,
  search,
  selectedId,
  onSearchChange,
  onSelect,
  onDrill,
  onAdd,
}: {
  rows: RecordListRow[];
  search: string;
  selectedId: string | null;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onDrill: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <section className="species-list-pane">
      <RecordList
        title="Species"
        rightHeaderAction={
          <button
            className="record-header-action right"
            type="button"
            title="Add species"
            aria-label="Add species"
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
        drillLabel="Show breeds"
      />
    </section>
  );
}

export function BreedListWorkspace({
  rows,
  search,
  selectedId,
  emptyText,
  onSearchChange,
  onSelect,
  onBack,
  onAdd,
  children,
}: {
  rows: RecordListRow[];
  search: string;
  selectedId: string | null;
  emptyText: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onBack: () => void;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="geo-workspace nested-workspace">
      <RecordList
        title="Breeds"
        headerAction={
          <button
            className="record-header-action"
            type="button"
            title="Back to species"
            aria-label="Back to species"
            onClick={onBack}
          >
            <ArrowLeft size={16} />
          </button>
        }
        rightHeaderAction={
          <button
            className="record-header-action right"
            type="button"
            title="Add breed"
            aria-label="Add breed"
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
      />
      {children}
    </section>
  );
}
