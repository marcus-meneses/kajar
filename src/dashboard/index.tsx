import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Clock3, Cpu, Database, HardDrive, MemoryStick, RefreshCw, Server } from "lucide-react";
import { Status } from "../shared";
import type { ApiClient, StatusState, SystemMetrics } from "../shared";

type RequestErrorHandler = (title: string, error: unknown, fallback: string) => void;
type Sample = { at: string; cpu: number; memory: number; load: number };
const bytes = (value: number) => { const units = ["B", "KiB", "MiB", "GiB", "TiB"]; let amount = value; let index = 0; while (amount >= 1024 && index < units.length - 1) { amount /= 1024; index += 1; } return `${amount.toFixed(index < 2 ? 0 : 1)} ${units[index]}`; };
const duration = (seconds: number) => { const days = Math.floor(seconds / 86400); const hours = Math.floor((seconds % 86400) / 3600); const minutes = Math.floor((seconds % 3600) / 60); return `${days}d ${hours}h ${minutes}m`; };

function MetricCard({ icon: Icon, label, value, detail }: { icon: typeof Cpu; label: string; value: string; detail: string }) {
  return <article className="system-metric"><Icon size={19} /><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}
function LineChart({ samples, field, label, color, maximum = 100 }: { samples: Sample[]; field: "cpu" | "memory" | "load"; label: string; color: string; maximum?: number }) {
  const values = samples.map((sample) => sample[field]);
  const ceiling = Math.max(maximum, ...values, 1);
  const points = values.map((value, index) => `${values.length <= 1 ? 0 : (index / (values.length - 1)) * 100},${40 - (value / ceiling) * 36}`).join(" ");
  const latest = values.at(-1) ?? 0;
  return <article className="system-chart"><header><span>{label}</span><strong>{latest.toFixed(1)}{field === "load" ? "" : "%"}</strong></header><svg viewBox="0 0 100 42" preserveAspectRatio="none" role="img" aria-label={`${label}: ${latest.toFixed(1)}`}><line x1="0" y1="40" x2="100" y2="40" /><line x1="0" y1="22" x2="100" y2="22" /><polyline points={points} style={{ stroke: color }} /></svg><footer><span>Janela de {samples.length * 5}s</span><span>{ceiling.toFixed(0)} máx.</span></footer></article>;
}

export function Dashboard({ api, onRequestError }: { api: ApiClient; onRequestError: RequestErrorHandler }) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [status, setStatus] = useState<StatusState>({ kind: "loading", text: "Carregando métricas do servidor..." });
  const [loading, setLoading] = useState(false);
  const [processOrder, setProcessOrder] = useState<"memory" | "cpu">("memory");
  const orderedGroups = useMemo(() => [...(metrics?.processGroups ?? [])].sort((left, right) => processOrder === "memory" ? right.residentBytes - left.residentBytes : right.cpuPercent - left.cpuPercent), [metrics, processOrder]);
  const load = useCallback(async (reportError = true) => {
    setLoading(true);
    try {
      const response = await api.getSystemMetrics();
      setMetrics(response.data);
      setSamples((current) => [...current, { at: response.data.sampledAt, cpu: response.data.cpu.usagePercent, memory: response.data.memory.usagePercent, load: response.data.cpu.loadAverage[0] ?? 0 }].slice(-24));
      setStatus({ kind: "ok", text: "Métricas atualizadas automaticamente a cada 5 segundos." });
    } catch (error) {
      setMetrics(null);
      setStatus({ kind: "error", text: "Não foi possível carregar as métricas do servidor." });
      if (reportError) onRequestError("Falha ao carregar métricas", error, "Não foi possível carregar as métricas do servidor.");
    } finally { setLoading(false); }
  }, [api, onRequestError]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(false), 5000); return () => window.clearInterval(timer); }, [load]);

  return <section className="dashboard-view system-dashboard">
    <header className="dashboard-head"><div><h2>Infraestrutura</h2><span>{metrics ? `${metrics.hostname} · ${metrics.platform}` : "Estado atual do servidor"}</span></div><button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} />Atualizar</button></header>
    <Status status={status} />
    {metrics && <>
      <section className="system-metrics" aria-label="Resumo do servidor">
        <MetricCard icon={Cpu} label="CPU" value={`${metrics.cpu.usagePercent.toFixed(1)}%`} detail={`${metrics.cpu.cores} núcleos · ${metrics.cpu.idlePercent.toFixed(1)}% ociosa`} />
        <MetricCard icon={MemoryStick} label="Memória" value={`${metrics.memory.usagePercent.toFixed(1)}%`} detail={`${bytes(metrics.memory.availableBytes)} disponíveis`} />
        <MetricCard icon={Activity} label="Carga" value={metrics.cpu.loadAverage[0]?.toFixed(2) ?? "0"} detail={metrics.cpu.loadAverage.map((value) => value.toFixed(2)).join(" · ")} />
        <MetricCard icon={HardDrive} label="Disco" value={`${metrics.disk.usagePercent.toFixed(1)}%`} detail={`${bytes(metrics.disk.freeBytes)} livres`} />
        <MetricCard icon={Database} label="Swap" value={metrics.swap.totalBytes ? bytes(metrics.swap.usedBytes) : "Desativada"} detail={metrics.swap.totalBytes ? `${bytes(metrics.swap.totalBytes)} total` : "Sem área de troca"} />
        <MetricCard icon={Clock3} label="Uptime" value={duration(metrics.uptimeSeconds)} detail={new Date(metrics.sampledAt).toLocaleTimeString("pt-BR")} />
      </section>
      <section className="system-charts"><LineChart samples={samples} field="cpu" label="Uso de CPU" color="#5968c5" /><LineChart samples={samples} field="memory" label="Uso de memória" color="#1f8a70" /><LineChart samples={samples} field="load" label="Load average (1 min)" color="#d97706" maximum={metrics.cpu.cores} /></section>
      <section className="process-panel"><header><div><Server size={18} /><h3>Consumo por componente</h3></div><div className="process-order" role="group" aria-label="Ordenar componentes"><button type="button" className={processOrder === "memory" ? "active" : ""} onClick={() => setProcessOrder("memory")}>Memória</button><button type="button" className={processOrder === "cpu" ? "active" : ""} onClick={() => setProcessOrder("cpu")}>CPU</button></div></header><div className="process-table-wrap"><table><thead><tr><th>Componente</th><th>Estado</th><th>Processos</th><th>CPU</th><th>Memória</th><th>RSS</th></tr></thead><tbody>{orderedGroups.map((group) => <tr key={group.key}><td><strong>{group.label}</strong></td><td><span className={`process-state `}>{group.active ? "Ativo" : "Inativo"}</span></td><td>{group.processCount}</td><td>{group.cpuPercent.toFixed(1)}%</td><td>{group.memoryPercent.toFixed(1)}%</td><td>{bytes(group.residentBytes)}</td></tr>)}</tbody></table></div></section>
    </>}
  </section>;
}
