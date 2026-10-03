import React from "react";
import { ChevronLeft, Save } from "lucide-react";
import type { WorkScheduleTemplateWeeklyRuleMirror, Weekday } from "../../shared";

const capacityInMinutes = (rule: WorkScheduleTemplateWeeklyRuleMirror): number => {
  const toMinutes = (value: string) => {
    const [hours = 0, minutes = 0] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  if (!rule.active || !rule.startTime || !rule.endTime) return 0;
  const workingMinutes = Math.max(0, toMinutes(rule.endTime) - toMinutes(rule.startTime));
  const breakMinutes = rule.breakStartTime && rule.breakEndTime
    ? Math.max(0, toMinutes(rule.breakEndTime) - toMinutes(rule.breakStartTime))
    : 0;
  return Math.max(0, workingMinutes - breakMinutes);
};

const weekdayLabels: Record<Weekday, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export function WeeklyRulesMirrorEditor({
  templateName,
  rules,
  loading,
  saving,
  onChange,
  onBack,
  onSave,
}: {
  templateName: string;
  rules: WorkScheduleTemplateWeeklyRuleMirror[];
  loading: boolean;
  saving: boolean;
  onChange: (rule: WorkScheduleTemplateWeeklyRuleMirror) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  return (
    <section className="weekly-rules-editor">
      <header className="weekly-rules-head">
        <button className="secondary-button" type="button" onClick={onBack}>
          <ChevronLeft size={16} /> Back
        </button>
        <div><h2>Weekly rules</h2><span>{templateName}</span></div>
      </header>
      {loading ? (
        <p className="weekly-rules-message">Loading weekly rules...</p>
      ) : rules.length !== 7 ? (
        <p className="weekly-rules-message">The template does not have all seven weekly rules.</p>
      ) : (
        <div className="weekly-rules-list">
          {rules.map((rule) => (
            <fieldset className="weekly-rule-row" key={rule.id}>
              <legend>{weekdayLabels[rule.weekday]}</legend>
              <label>Start<input type="time" value={rule.startTime?.slice(0, 5) ?? ""} disabled={!rule.active} onChange={(event) => onChange({ ...rule, startTime: event.target.value })} /></label>
              <label>Break start<input type="time" value={rule.breakStartTime?.slice(0, 5) ?? ""} disabled={!rule.active} onChange={(event) => onChange({ ...rule, breakStartTime: event.target.value || null })} /></label>
              <label>Break end<input type="time" value={rule.breakEndTime?.slice(0, 5) ?? ""} disabled={!rule.active} onChange={(event) => onChange({ ...rule, breakEndTime: event.target.value || null })} /></label>
              <label>End<input type="time" value={rule.endTime?.slice(0, 5) ?? ""} disabled={!rule.active} onChange={(event) => onChange({ ...rule, endTime: event.target.value })} /></label>
              <label>Capacity (minutes)<input type="number" value={capacityInMinutes(rule)} disabled readOnly /></label>
              <label className="weekly-rule-active"><input type="checkbox" checked={rule.active} onChange={(event) => onChange(event.target.checked ? { ...rule, active: true } : { ...rule, active: false, startTime: null, endTime: null, breakStartTime: null, breakEndTime: null, capacity: 0 })} />Active</label>
            </fieldset>
          ))}
        </div>
      )}
      <div className="editor-actions weekly-rules-actions">
        <span />
        <button className="primary-button save-button" type="button" disabled={loading || saving || rules.length !== 7} onClick={onSave}>
          <Save size={16} /> Save weekly rules
        </button>
      </div>
    </section>
  );
}
