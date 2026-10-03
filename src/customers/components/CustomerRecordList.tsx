import React from "react";
import { ArrowRight, Search, UserPlus, UserRound } from "lucide-react";

export type CustomerRecordListRow = {
  id: string;
  primary: string;
  secondary: string;
  actionLabel?: string;
};

export function CustomerRecordList({
  title,
  headerAction,
  rightHeaderAction,
  search,
  onSearchChange,
  rows,
  selectedId,
  onSelect,
  onDrill,
  drillLabel,
  drillIcon = "user",
  onLoadMore,
  loadingMore = false,
}: {
  title: string;
  headerAction?: React.ReactNode;
  rightHeaderAction?: React.ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  rows: CustomerRecordListRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDrill?: (id: string) => void;
  drillLabel?: string;
  drillIcon?: "arrow" | "user";
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
                  title={row.actionLabel ?? drillLabel}
                  aria-label={
                    (row.actionLabel ?? drillLabel ?? "Manage related record") +
                    " for " +
                    row.primary
                  }
                  onClick={() => onDrill(row.id)}
                >
                  {drillIcon === "arrow" ? (
                    <ArrowRight size={16} />
                  ) : row.actionLabel === "Add user" ? (
                    <UserPlus size={16} />
                  ) : (
                    <UserRound size={16} />
                  )}
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
          No {title.toLowerCase()} match the current search.
        </div>
      )}
    </section>
  );
}
