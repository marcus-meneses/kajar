export function ModalField({
  label,
  value,
  required,
  onChoose,
  onClear,
}: {
  label: string;
  value: string;
  required?: boolean;
  onChoose: () => void;
  onClear?: () => void;
}) {
  return (
    <fieldset className="parent-field">
      <legend>
        {label}
        {required ? " *" : ""}
      </legend>
      <div className="parent-summary">
        <span>{value}</span>
        <div>
          <button className="secondary-button" type="button" onClick={onChoose}>
            Choose
          </button>
          {onClear && (
            <button
              className="secondary-button"
              type="button"
              onClick={onClear}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </fieldset>
  );
}
