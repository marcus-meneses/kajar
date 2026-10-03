import { Plus, RefreshCw } from "lucide-react";
import { Metric } from "../../shared";

export function PermissionSummary({
  total,
  configured,
  active,
  visible,
  onRefresh,
  onCreate,
}: {
  total: number;
  configured: number;
  active: number;
  visible: number;
  onRefresh: () => void;
  onCreate: () => void;
}) {
  return (
    <section className="summary" aria-label="Permission summary">
      <Metric value={total} label="Total routes" />
      <Metric value={configured} label="Configured" />
      <Metric value={active} label="Active" />
      <Metric value={visible} label="Visible" />
      <button
        className="metric-action secondary"
        type="button"
        onClick={onRefresh}
      >
        <RefreshCw size={17} />
        Refresh routes
      </button>
      <button className="metric-action" type="button" onClick={onCreate}>
        <Plus size={17} />
        New rule
      </button>
    </section>
  );
}
