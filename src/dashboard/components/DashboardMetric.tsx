import type { LucideIcon } from "lucide-react";

export function DashboardMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <div className="dashboard-metric">
      <Icon size={18} aria-hidden="true" />
      <strong>{value.toLocaleString()}</strong>
      <span>{label}</span>
    </div>
  );
}
