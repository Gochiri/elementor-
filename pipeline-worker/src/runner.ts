import { supabase } from "./supabase.js";
import { generateCopy, type PageTarget, type CopyResult } from "./steps/copy.js";
import { researchKeywords } from "./steps/keywords.js";
import { buildWireframes } from "./steps/wireframes.js";
import type { Project, StepState } from "./types.js";

export async function runStep(state: StepState): Promise<void> {
  try {
    switch (state.step) {
      case 1:
        await runKeywords(state);
        break;
      case 2:
        await runCopy(state);
        break;
      case 3:
        await runWireframes(state);
        break;
      default:
        await setStatus(state, "needs_review", `Paso ${state.step} todavía no automatizado en el worker.`);
    }
  } catch (e) {
    await setStatus(state, "error", e instanceof Error ? e.message : String(e));
  }
}

async function runKeywords(state: StepState): Promise<void> {
  const project = await loadProject(state.project_id);
  const research = await researchKeywords(project);
  const kwCount = research.pages.reduce((n, p) => n + p.keywords.length, 0);

  await replaceArtifact(state.project_id, 1, {
    type: "keyword_research",
    label: research.enriched
      ? `Keyword research (${kwCount} kw, ${research.pages.length} páginas)`
      : `Keywords candidatas (${kwCount}, sin métricas)`,
    url: null,
    payload: research,
  });

  if (research.enriched) {
    await setStatus(state, "done", `Keyword research: ${research.pages.length} páginas, ${kwCount} keywords.`);
  } else {
    await setStatus(
      state,
      "needs_review",
      "Keywords candidatas generadas. Métricas pendientes: falta SERANKING_API_KEY (Data API de pago)."
    );
  }
}

async function runCopy(state: StepState): Promise<void> {
  const project = await loadProject(state.project_id);
  const pages = await loadPagesFromKeywordResearch(state.project_id);
  const result = await generateCopy(project, pages);

  await replaceArtifact(state.project_id, 2, {
    type: "copy",
    label: `Copy generado (${result.pages.length} páginas)`,
    url: null,
    payload: result,
  });
  await setStatus(state, "done", `Copy generado: ${result.pages.length} páginas.`);
}

async function runWireframes(state: StepState): Promise<void> {
  const project = await loadProject(state.project_id);
  const copy = await loadCopy(state.project_id);
  if (!copy) {
    await setStatus(state, "needs_review", "Faltan datos: ejecuta primero el paso ② Copy.");
    return;
  }
  const wf = await buildWireframes(copy, project.name);
  await replaceArtifact(state.project_id, 3, {
    type: "wireframe",
    label: `Wireframes (${wf.pageCount} páginas)`,
    url: null,
    payload: { html: wf.html },
  });
  await setStatus(state, "done", `Wireframes generados: ${wf.pageCount} páginas · ${wf.mode}.`);
}

async function loadCopy(projectId: string): Promise<CopyResult | null> {
  const { data } = await supabase
    .from("artifacts")
    .select("payload")
    .eq("project_id", projectId)
    .eq("type", "copy")
    .order("created_at", { ascending: false })
    .limit(1);
  const payload = data?.[0]?.payload as CopyResult | undefined;
  return payload?.pages?.length ? payload : null;
}

async function loadProject(id: string): Promise<Project> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error || !data) throw new Error(`No se pudo cargar el proyecto ${id}: ${error?.message}`);
  return data as Project;
}

// Usa las páginas/keywords del artefacto del paso ① si existe; si no, lista vacía.
async function loadPagesFromKeywordResearch(projectId: string): Promise<PageTarget[]> {
  const { data } = await supabase
    .from("artifacts")
    .select("payload")
    .eq("project_id", projectId)
    .eq("type", "keyword_research")
    .order("created_at", { ascending: false })
    .limit(1);

  const payload = data?.[0]?.payload as
    | { pages?: { page: string; keywords: { keyword: string }[] }[] }
    | undefined;
  if (!Array.isArray(payload?.pages)) return [];
  return payload!.pages.map((p) => ({
    page: p.page,
    keywords: p.keywords.map((k) => k.keyword),
  }));
}

interface NewArtifact {
  type: string;
  label: string;
  url: string | null;
  payload: unknown;
}

// Idempotente: borra los artefactos previos de ese paso y re-inserta.
async function replaceArtifact(projectId: string, step: number, a: NewArtifact): Promise<void> {
  await supabase.from("artifacts").delete().eq("project_id", projectId).eq("step", step);
  const { error } = await supabase.from("artifacts").insert({ project_id: projectId, step, ...a });
  if (error) throw new Error(`No se pudo guardar el artefacto: ${error.message}`);
}

async function setStatus(state: StepState, status: string, logs: string): Promise<void> {
  const { error } = await supabase
    .from("step_states")
    .update({ status, logs, updated_at: new Date().toISOString() })
    .eq("id", state.id);
  if (error) throw new Error(`No se pudo actualizar el estado: ${error.message}`);
  console.log(`  · paso ${state.step} → ${status}: ${logs}`);
}
