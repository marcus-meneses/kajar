import React, { useEffect, useRef } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export type TreeRow = {
  id: string;
  primary: string;
  secondary: string;
  depth: number;
};

export function TreeList({
  title,
  search,
  onSearchChange,
  rows,
  selectedId,
  expanded,
  loading,
  onSelect,
  onToggle,
}: {
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  rows: TreeRow[];
  selectedId: string | null;
  expanded: string[];
  loading: string[];
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="table-panel geo-list">
      <header>
        <h2>{title}</h2>
        <div className="geo-list-controls">
          <label className="search-field geo-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={"Search loaded " + title.toLowerCase()}
            />
          </label>
        </div>
      </header>
      {rows.length ? (
        <TreeRows
          rows={rows}
          selectedId={selectedId}
          expanded={expanded}
          loading={loading}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ) : (
        <div className="empty-state geo-empty">
          No {title.toLowerCase()} match the current search.
        </div>
      )}
    </section>
  );
}
function TreeRows({
  rows,
  selectedId,
  expanded,
  loading,
  onSelect,
  onToggle,
}: {
  rows: TreeRow[];
  selectedId: string | null;
  expanded: string[];
  loading: string[];
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      {rows.map((row) => (
        <div
          key={row.id}
          className={
            "record-row tree-row " + (row.id === selectedId ? "selected" : "")
          }
          style={{ "--tree-depth": String(row.depth) } as React.CSSProperties}
        >
          <button
            className="record-main"
            type="button"
            onClick={() => onSelect(row.id)}
          >
            <strong>{row.primary}</strong>
            <span>
              {loading.includes(row.id) ? "Loading children..." : row.secondary}
            </span>
          </button>
          <button
            className={
              "record-drill tree-toggle " +
              (expanded.includes(row.id) ? "expanded" : "")
            }
            type="button"
            title="Load child entries"
            onClick={() => onToggle(row.id)}
          >
            <ChevronDown size={17} />
          </button>
        </div>
      ))}
    </div>
  );
}
export function ParentPickerModal({
  title,
  search,
  onSearchChange,
  rows,
  selectedId,
  expanded,
  loading,
  onSelect,
  onToggle,
  onRoot,
  onClose,
}: {
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  rows: TreeRow[];
  selectedId: string | null;
  expanded: string[];
  loading: string[];
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onRoot: () => void;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const selectedRow = modalRef.current?.querySelector<HTMLElement>(
      ".parent-picker-list .record-row.selected",
    );
    selectedRow?.scrollIntoView({ block: "center" });
  }, [rows, selectedId]);
  return (
    <div className="modal-backdrop">
      <section
        ref={modalRef}
        className="modal parent-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="parent-picker-title"
      >
        <header className="modal-head">
          <h2 id="parent-picker-title">Choose {title} parent</h2>
        </header>
        <div className="modal-body parent-picker-body">
          <label className="search-field geo-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={"Search loaded " + title.toLowerCase()}
              autoFocus
            />
          </label>
          <div className="parent-picker-root">
            <button
              className={
                "record-main " + (!selectedId ? "selected-parent" : "")
              }
              type="button"
              onClick={onRoot}
            >
              <strong>Root category</strong>
              <span>No parent</span>
            </button>
          </div>
          <div className="parent-picker-list">
            {rows.length ? (
              <TreeRows
                rows={rows}
                selectedId={selectedId}
                expanded={expanded}
                loading={loading}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ) : (
              <div className="empty-state geo-empty">
                No {title.toLowerCase()} match the current search.
              </div>
            )}
          </div>
        </div>
        <footer className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            <X size={16} />
            Cancel
          </button>
        </footer>
      </section>
    </div>
  );
}
