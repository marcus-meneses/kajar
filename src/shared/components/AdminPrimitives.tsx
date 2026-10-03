import React from "react";
import { ArrowRight, Plus, Save, Search, Trash2 } from "lucide-react";

export type StatusState = {
  kind: "idle" | "ok" | "error" | "loading";
  text: string;
};
export type RecordListRow = { id: string; primary: string; secondary: string };

export function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function Status({ status }: { status: StatusState }) {
  if (!status.text) return null;
  return <div className={"status " + status.kind}>{status.text}</div>;
}

export function EmptyState({ text }: { text: string }) {
  return (
    <aside className="editor empty-state">
      <p>{text}</p>
    </aside>
  );
}

export function EditorHead({
  title,
  id,
}: {
  title: string;
  id: string | null;
}) {
  return (
    <header className="editor-head">
      <h2>{title}</h2>
      <span>{id ?? "Unsaved record"}</span>
    </header>
  );
}

export function EditorActions({
  saving,
  selected,
  newLabel,
  saveLabel,
  onNew,
  onDelete,
  hideNew = false,
}: {
  saving: boolean;
  selected: boolean;
  newLabel: string;
  saveLabel: string;
  onNew: () => void;
  onDelete: () => void;
  hideNew?: boolean;
}) {
  return (
    <div className="editor-actions">
      <div className="geo-action-left">
        {!hideNew && (
          <button className="secondary-button" type="button" onClick={onNew}>
            <Plus size={16} />
            {newLabel}
          </button>
        )}
        {selected && (
          <button
            className="danger-button"
            type="button"
            onClick={onDelete}
            disabled={saving}
          >
            <Trash2 size={16} />
            Delete
          </button>
        )}
      </div>
      <button
        className="primary-button save-button"
        type="submit"
        disabled={saving}
      >
        <Save size={16} />
        {saveLabel}
      </button>
    </div>
  );
}

export function RecordList({
  title,
  headerAction,
  rightHeaderAction,
  search,
  onSearchChange,
  filterControl,
  rows,
  selectedId,
  onSelect,
  onDrill,
  drillLabel,
  emptyText,
  onLoadMore,
  loadingMore = false,
}: {
  title: string;
  headerAction?: React.ReactNode;
  rightHeaderAction?: React.ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  filterControl?: React.ReactNode;
  rows: RecordListRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDrill?: (id: string) => void;
  drillLabel?: string;
  emptyText?: string;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    const target = event.currentTarget;
    if (
      onLoadMore &&
      !loadingMore &&
      target.scrollTop + target.clientHeight >= target.scrollHeight - 80
    )
      onLoadMore();
  };
  return (
    <section
      className={
        "table-panel geo-list " +
        (headerAction ? "has-header-action " : "") +
        (rightHeaderAction ? "has-right-header-action " : "") +
        (loadingMore ? "loading-scroll" : "")
      }
      onScroll={handleScroll}
    >
      <header>
        {headerAction}
        <div className="geo-list-header-content">
          <h2>{title}</h2>
          <div className="geo-list-controls">
            {filterControl}
            <label className="search-field geo-search">
              <Search size={16} aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={"Search " + title.toLowerCase()}
              />
            </label>
          </div>
        </div>
        {rightHeaderAction}
      </header>
      {rows.length ? (
        <div>
          {rows.map((row) => (
            <div
              key={row.id}
              className={
                "record-row " + (row.id === selectedId ? "selected" : "")
              }
            >
              <button
                className="record-main"
                type="button"
                onClick={() => onSelect(row.id)}
              >
                <strong>{row.primary}</strong>
                <span>{row.secondary || row.id}</span>
              </button>
              {onDrill && (
                <button
                  className="record-drill"
                  type="button"
                  title={drillLabel}
                  aria-label={
                    (drillLabel ?? "Open related records") +
                    " for " +
                    row.primary
                  }
                  onClick={() => onDrill(row.id)}
                >
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          ))}
          {loadingMore && (
            <div className="empty-state geo-empty loading-more">
              Loading more...
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state geo-empty">
          {emptyText ??
            "No " + title.toLowerCase() + " match the current search."}
        </div>
      )}
    </section>
  );
}
