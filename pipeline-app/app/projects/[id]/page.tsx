import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StepBoard } from "@/components/StepBoard";
import { DeleteProject } from "@/components/DeleteProject";
import { AutoRefresh } from "@/components/AutoRefresh";
import { deleteProject } from "./actions";
import { PIPELINE_STEPS } from "@/lib/types";
import type { Project, StepState, Artifact } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!project) notFound();
  const p = project as Project;

  const [{ data: states }, { data: artifacts }] = await Promise.all([
    supabase.from("step_states").select("*").eq("project_id", p.id).order("step"),
    supabase.from("artifacts").select("*").eq("project_id", p.id).order("step"),
  ]);

  const linkGroups: { label: string; urls: string[] }[] = [
    { label: "Briefing", urls: p.briefing_doc_urls ?? [] },
    { label: "Estructura", urls: p.structure_sheet_urls ?? [] },
    { label: "Relume", urls: p.relume_urls ?? [] },
  ];

  const stepStates = (states as StepState[]) ?? [];
  const doneCount = stepStates.filter((s) => s.status === "done").length;
  const hasRunning = stepStates.some((s) => s.status === "running");

  return (
    <>
        <AutoRefresh active={hasRunning} />
        <div className="ops">
          <div className="ops-chrome"><i></i><i></i><i></i></div>
          <div className="ops-head">
            <span className="ops-title">{p.name}</span>
            <span className="ops-dom">{p.domain || "dominio pendiente"}</span>
            <span className="ops-run">{doneCount}/{PIPELINE_STEPS.length} completado</span>
          </div>
          <div className="ops-links">
            {linkGroups.map((g) =>
              g.urls.length ? (
                g.urls.map((url, i) => (
                  <a key={`${g.label}-${i}`} href={url} target="_blank" rel="noreferrer">
                    {g.label}{g.urls.length > 1 ? ` ${i + 1}` : ""} ↗
                  </a>
                ))
              ) : (
                <span key={g.label}>{g.label}: —</span>
              )
            )}
          </div>
          <StepBoard projectId={p.id} states={stepStates} artifacts={(artifacts as Artifact[]) ?? []} />
        </div>

        <p className="muted" style={{ marginTop: 20 }}>
          Fase 1: el paso ② Copy ya se ejecuta con el worker (pulsa «Ejecutar»). El resto
          (SE Ranking, wireframes, Figma, Elementor) llega en las fases siguientes.
        </p>

        <DeleteProject projectId={p.id} projectName={p.name} action={deleteProject} />
    </>
  );
}
