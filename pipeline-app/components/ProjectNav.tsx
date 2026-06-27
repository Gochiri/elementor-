"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PIPELINE_STATUS_LABEL, type PipelineStatus } from "@/lib/types";

type NavProject = { id: string; name: string; status: PipelineStatus };

const MAX = 6;

export function ProjectNav({ projects }: { projects: NavProject[] }) {
  const path = usePathname();
  const activeId = projects.find(
    (p) => path === `/projects/${p.id}` || path.startsWith(`/projects/${p.id}/`)
  )?.id;

  // Muestra los más recientes; si el proyecto activo queda fuera, lo incluye igualmente.
  let shown = projects.slice(0, MAX);
  if (activeId && !shown.some((p) => p.id === activeId)) {
    const act = projects.find((p) => p.id === activeId)!;
    shown = [...shown.slice(0, MAX - 1), act];
  }

  return (
    <aside className="sidebar">
      <Link href="/projects/new" className="sidebar-new">+ Nuevo proyecto</Link>
      <nav className="pnav">
        <Link href="/projects" className={`pnav-item ${path === "/projects" ? "active" : ""}`}>
          <span className="pnav-dot panel" />
          Panel
        </Link>
        {shown.map((p) => {
          const active = p.id === activeId;
          return (
            <Link key={p.id} href={`/projects/${p.id}`} className={`pnav-item ${active ? "active" : ""}`}>
              <span
                className={`pnav-dot ${p.status}`}
                title={PIPELINE_STATUS_LABEL[p.status]}
                aria-label={PIPELINE_STATUS_LABEL[p.status]}
              />
              {p.name}
            </Link>
          );
        })}
        {projects.length > MAX && (
          <Link href="/projects" className="pnav-more">Ver los {projects.length} →</Link>
        )}
        {projects.length === 0 && <span className="pnav-empty">Sin proyectos todavía</span>}
      </nav>
    </aside>
  );
}
