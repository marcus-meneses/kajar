import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, X } from "lucide-react";

export type PickerRow = { id: string; primary: string; secondary: string };

export function RecordPickerModal({
  title,
  rows,
  selectedId,
  loading,
  nullable = false,
  search: controlledSearch,
  onSearchChange,
  serverSearch = false,
  onSelect,
  onClose,
  onBack,
  onLoadMore,
  loadingMore = false,
}: {
  title: string;
  rows: PickerRow[];
  selectedId: string | null;
  loading: boolean;
  nullable?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  serverSearch?: boolean;
  onSelect: (id: string | null) => void;
  onClose: () => void;
  onBack?: () => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}) {
  const [localSearch, setLocalSearch] = useState("");
  const selectedRowRef = useRef<HTMLDivElement | null>(null);
  const search = controlledSearch ?? localSearch;
  const needle = search.trim().toLowerCase();
  const visibleRows =
    serverSearch || !needle
      ? rows
      : rows.filter((row) =>
          (row.primary + " " + row.secondary).toLowerCase().includes(needle),
        );
  useEffect(() => {
    if (!needle && selectedId && selectedRowRef.current)
      selectedRowRef.current.scrollIntoView({ block: "center" });
  }, [needle, selectedId, title, rows.length]);
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (
      (!needle || serverSearch) &&
      onLoadMore &&
      !loadingMore &&
      target.scrollTop + target.clientHeight >= target.scrollHeight - 80
    )
      onLoadMore();
  };
  return createPortal(
    <div className="modal-backdrop">
      <section className="modal parent-picker" role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>Choose {title}</h2>
        </header>
        <div className="modal-body parent-picker-body">
          <div className={"modal-search-row " + (onBack ? "has-back" : "")}>
            {onBack && (
              <button
                className="record-header-action modal-back-action"
                type="button"
                title="Back"
                aria-label="Back"
                onClick={onBack}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <label className="search-field geo-search">
              <Search size={16} aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  if (onSearchChange) onSearchChange(value);
                  else setLocalSearch(value);
                }}
                autoFocus
                placeholder={"Search " + title.toLowerCase()}
              />
            </label>
          </div>
          {nullable && (
            <div className="parent-picker-root">
              <button
                className={
                  "record-main " + (!selectedId ? "selected-parent" : "")
                }
                type="button"
                onClick={() => onSelect(null)}
              >
                <strong>None</strong>
                <span>No selected {title.toLowerCase()}</span>
              </button>
            </div>
          )}
          <div className="parent-picker-list" onScroll={handleScroll}>
            {loading && !rows.length ? (
              <div className="empty-state geo-empty">Loading...</div>
            ) : visibleRows.length ? (
              <>
                {visibleRows.map((row) => (
                  <div
                    key={row.id}
                    ref={row.id === selectedId ? selectedRowRef : undefined}
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
                      <span>{row.secondary}</span>
                    </button>
                  </div>
                ))}
                {loadingMore && (
                  <div className="empty-state geo-empty loading-more">
                    Loading more...
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state geo-empty">
                No records match the current search.
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
    </div>,
    document.body,
  );
}
