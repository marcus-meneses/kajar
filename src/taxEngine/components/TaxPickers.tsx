import { useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Save, X } from "lucide-react";

const cleanText = (value: string | null | undefined): string | null => {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
};

export function DateFields({
  dateStart,
  dateEnd,
  onChange,
}: {
  dateStart: string;
  dateEnd: string | null | undefined;
  onChange: (dateStart: string, dateEnd: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <fieldset className="parent-field">
      <legend>Dates</legend>
      <div className="parent-summary">
        <span>
          {"Start: " +
            (dateStart || "Not set") +
            " / End: " +
            (dateEnd || "No end date")}
        </span>
        <div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setOpen(true)}
          >
            <CalendarDays size={16} />
            Choose
          </button>
          {dateEnd && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => onChange(dateStart, null)}
            >
              <X size={16} />
              Clear end
            </button>
          )}
        </div>
      </div>
      {open && (
        <DatePickerModal
          dateStart={dateStart}
          dateEnd={dateEnd ?? null}
          onSelect={(nextStart, nextEnd) => {
            onChange(nextStart, nextEnd);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </fieldset>
  );
}

function DatePickerModal({
  dateStart,
  dateEnd,
  onSelect,
  onClose,
}: {
  dateStart: string;
  dateEnd: string | null;
  onSelect: (dateStart: string, dateEnd: string | null) => void;
  onClose: () => void;
}) {
  const [nextStart, setNextStart] = useState(dateStart);
  const [nextEnd, setNextEnd] = useState(dateEnd ?? "");
  return createPortal(
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true">
        <header className="modal-head">
          <h2>Choose dates</h2>
        </header>
        <div className="modal-body form-grid">
          <label>
            Start date
            <input
              type="date"
              value={nextStart}
              onChange={(event) => setNextStart(event.target.value)}
              required
            />
          </label>
          <label>
            End date
            <input
              type="date"
              value={nextEnd}
              onChange={(event) => setNextEnd(event.target.value)}
            />
          </label>
        </div>
        <footer className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            <X size={16} />
            Cancel
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => onSelect(nextStart, cleanText(nextEnd))}
          >
            <Save size={16} />
            Apply
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
