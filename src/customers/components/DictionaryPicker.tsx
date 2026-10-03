import { useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import type { DictionaryEntry } from "../../shared";

export function dictionaryValue(entry: DictionaryEntry): string {
  return String(entry.abbreviation ?? entry.acronym ?? entry.index ?? "");
}
export function dictionaryDescription(entry: DictionaryEntry): string {
  return entry.description ?? "";
}
export function dictionaryOptionLabel(entry: DictionaryEntry): string {
  return dictionaryValue(entry) + " - " + dictionaryDescription(entry);
}
export function dictionaryLabel(
  entries: DictionaryEntry[],
  value: string,
): string {
  const entry = entries.find((item) => dictionaryValue(item) === value);
  return entry ? dictionaryOptionLabel(entry) : value || "No value selected";
}

export function DictionarySelect({
  label,
  value,
  entries,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  entries: DictionaryEntry[];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        {!entries.some((entry) => dictionaryValue(entry) === value) && (
          <option value={value}>{value || "Select"}</option>
        )}
        {entries.map((entry) => {
          const entryValue = dictionaryValue(entry);
          return (
            <option key={entryValue} value={entryValue}>
              {dictionaryOptionLabel(entry)}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export function DictionaryPickerModal({
  title,
  entries,
  selectedValue,
  onSelect,
  onClose,
}: {
  title: string;
  entries: DictionaryEntry[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const needle = search.trim().toLowerCase();
  const rows = needle
    ? entries.filter(
        (entry) =>
          dictionaryOptionLabel(entry).toLowerCase().includes(needle) ||
          String(entry.index).toLowerCase().includes(needle),
      )
    : entries;
  return createPortal(
    <div className="modal-backdrop">
      <section className="modal parent-picker" role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>Choose {title}</h2>
        </header>
        <div className="modal-body parent-picker-body">
          <label className="search-field geo-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              placeholder={"Search " + title.toLowerCase()}
            />
          </label>
          <div className="parent-picker-list">
            {rows.length ? (
              rows.map((entry) => {
                const value = dictionaryValue(entry);
                return (
                  <div
                    key={value}
                    className={
                      "record-row " +
                      (value === selectedValue ? "selected" : "")
                    }
                  >
                    <button
                      className="record-main"
                      type="button"
                      onClick={() => onSelect(value)}
                    >
                      <strong>{value}</strong>
                      <span>{dictionaryDescription(entry)}</span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="empty-state geo-empty">
                No dictionary values match the current search.
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
