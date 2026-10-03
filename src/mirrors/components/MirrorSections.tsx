import React from "react";
import { RecordList, type RecordListRow } from "../../shared";

export function MirrorSection({
  title,
  search,
  rows,
  selectedId,
  onSearchChange,
  onSelect,
  onDrill,
  drillLabel,
  children,
}: {
  title: string;
  search: string;
  rows: RecordListRow[];
  selectedId: string | null;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onDrill?: (id: string) => void;
  drillLabel?: string;
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
        onDrill={onDrill}
        drillLabel={drillLabel}
      />
      <aside className="editor">{children}</aside>
    </section>
  );
}
