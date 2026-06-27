import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PIPELINE_STEPS, pipelineStatus, PIPELINE_STATUS_LABEL, type PipelineStatus } from "@/lib/types";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

type Filter = "todos" | "needs" | "running" | "done" | "pending";
type Sort = "recientes" | "actividad" | "progreso";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "running", label: "En curso" },
  { key: "needs", label: "Necesita revisión" },
  { key: "done", label: "Completados" },
  { key: "pending", label: "Sin empezar" },
];

const SORTS: { key: Sort; label: string }[] = [
  { key: "recientes", label: "Recientes" },
  { key: "actividad", label: "Actividad" },
  { key: "progreso", label: "Progreso" },
];

function hace(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { filter?: string; sort?: string };
}) {
  const supabase = createClient();

  const [{ data: projects }, { data: steps }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("step_states").select("project_id,status,updated_at"),
  ]);

  const total = PIPELINE_STEPS.length;

  const stepsByProject = new Map<string, string[]>();
  const lastByProject = new Map<string, string>();
  for (const s of (steps as { project_id: string; status: string; updated_at: string }[] | null) ?? []) {
    const arr = stepsByProject.get(s.project_id) ?? [];
    arr.push(s.status);
    stepsByProject.set(s.project_id, arr);
    const prev = lastByProject.get(s.project_id);
    if (!prev || s.updated_at > prev) lastByProject.set(s.project_id, s.updated_at);
  }

  type Row = Project & { done: number; status: PipelineStatus; lastActivity: string | null };
  const rows: Row[] = ((projects as Project[] | null) ?? []).map((p) => {
    const { done, status } = pipelineStatus(stepsByProject.get(p.id) ?? [], total);
    return { ...p, done, status, lastActivity: lastByProject.get(p.id) ?? p.created_at };
  });

  // Números (sobre todos, antes de filtrar)
  const enCurso = rows.filter((r) => r.status === "running").length;
  const completados = rows.filter((r) => r.status === "done").length;
  const necesitaRevision = rows.filter((r) => r.status === "error" || r.status === "needs_review").length;

  // Filtro + orden (server, vía searchParams)
  const filter = (FILTERS.some((f) => f.key === searchParams.filter) ? searchParams.filter : "todos") as Filter;
  const sort = (SORTS.some((s) => s.key === searchParams.sort) ? searchParams.sort : "recientes") as Sort;

  let visible = rows;
  if (filter === "running") visible = rows.filter((r) => r.status === "running");
  else if (filter === "done") visible = rows.filter((r) => r.status === "done");
  else if (filter === "pending") visible = rows.filter((r) => r.status === "pending");
  else if (filter === "needs") visible = rows.filter((r) => r.status === "error" || r.status === "needs_review");

  if (sort === "progreso") visible = [...visible].sort((a, b) => b.done - a.done);
  else if (sort === "actividad") visible = [...visible].sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""));

  const qs = (over: { filter?: Filter; sort?: Sort }) => {
    const f = over.filter ?? filter;
    const s = over.sort ?? sort;
    const params = new URLSearchParams();
    if (f !== "todos") params.set("filter", f);
    if (s !== "recientes") params.set("sort", s);
    const str = params.toString();
    return str ? `/projects?${str}` : "/projects";
  };

  return (
    <>
      <div className="stats">
        <Stat n={rows.length} label="Proyectos" />
        <Stat n={enCurso} label="En curso" />
        <Stat n={completados} label="Completados" />
        <Stat n={necesitaRevision} label="Necesita revisión" alert={necesitaRevision > 0} />
      </div>

      <div className="proj-controls">
        <div className="chips">
          {FILTERS.map((f) => (
            <Link key={f.key} href={qs({ filter: f.key })} className={`chip ${filter === f.key ? "active" : ""}`}>
              {f.label}
            </Link>
          ))}
        </div>
        <div className="chips">
          <span className="chips-label">Orden</span>
          {SORTS.map((s) => (
            <Link key={s.key} href={qs({ sort: s.key })} className={`chip ${sort === s.key ? "active" : ""}`}>
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="proj-table">
        {visible.map((p) => {
          const pct = Math.round((p.done / total) * 100);
          return (
            <Link key={p.id} href={`/projects/${p.id}`} className="proj-row">
              <div className="proj-main">
                <div className="proj-name">{p.name}</div>
                <div className="proj-dom">
                  {p.domain || "dominio pendiente"} · {hace(p.lastActivity)}
                </div>
              </div>
              <div className="proj-prog">
                <div className={`proj-prog-bar ${p.status}`}><span style={{ width: `${pct}%` }} /></div>
                <span className="proj-prog-num">{p.done}/{total}</span>
              </div>
              <span className={`ops-pill ${p.status}`}>{PIPELINE_STATUS_LABEL[p.status]}</span>
            </Link>
          );
        })}
        {visible.length === 0 && (
          <div className="proj-empty">
            {rows.length === 0 ? (
              <>Aún no hay proyectos. <Link href="/projects/new">Crea el primero →</Link></>
            ) : (
              <>Ningún proyecto en «{FILTERS.find((f) => f.key === filter)?.label}».</>
            )}
          </div>
        )}
      </div>

      <details className="legend">
        <summary>¿Qué son los 8 pasos?</summary>
        <ol>
          {PIPELINE_STEPS.map((s) => (
            <li key={s.step}>
              <b>{s.step}.</b> {s.title}
              {!s.automated && <span className="legend-manual"> · manual</span>}
            </li>
          ))}
        </ol>
      </details>
    </>
  );
}

function Stat({ n, label, alert }: { n: number | string; label: string; alert?: boolean }) {
  return (
    <div className={`stat ${alert ? "stat-alert" : ""}`}>
      <div className="stat-num">{n}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
