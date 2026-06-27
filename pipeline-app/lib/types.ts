// Definición canónica del pipeline (8 pasos). El paso ⑤ es un gate humano (branding de Alberto).

export type StepStatus = "pending" | "running" | "needs_review" | "done" | "error";

export type ArtifactType =
  | "keyword_research"
  | "copy"
  | "wireframe"
  | "figma"
  | "ir"
  | "elementor";

export interface PipelineStepDef {
  step: number;
  key: string;
  title: string;
  desc: string;
  /** true = lo ejecuta el agente; false = trabajo humano (gate de revisión) */
  automated: boolean;
}

export const PIPELINE_STEPS: PipelineStepDef[] = [
  { step: 1, key: "keyword_research", title: "Keyword research (SE Ranking)", desc: "Investigación de palabras clave + content brief por página.", automated: true },
  { step: 2, key: "copy", title: "Copy por secciones", desc: "Title/Meta/H1 + copy SEO por sección, sin corte de caracteres.", automated: true },
  { step: 3, key: "wireframes", title: "Wireframes HTML", desc: "Wireframes lo-fi con el copy ya colocado.", automated: true },
  { step: 4, key: "figma_capture", title: "Captura a Figma", desc: "HTML → Figma como frames editables.", automated: true },
  { step: 5, key: "hifi", title: "Hi-fi + branding (Alberto)", desc: "Sistema de diseño + tokens + aprobación del cliente.", automated: false },
  { step: 6, key: "ir", title: "Section Plan (IR)", desc: "Formato puente Figma → Elementor.", automated: true },
  { step: 7, key: "elementor", title: "Build en Elementor v4", desc: "Construcción nativa, autogestionable (staging).", automated: true },
  { step: 8, key: "verify", title: "Verificación", desc: "Checklist visual + funcional.", automated: false },
];

export interface Project {
  id: string;
  name: string;
  domain: string | null;
  briefing_doc_urls: string[];
  structure_sheet_urls: string[];
  relume_urls: string[];
  status: string;
  created_by: string | null;
  created_at: string;
}

export interface StepState {
  id: string;
  project_id: string;
  step: number;
  status: StepStatus;
  logs: string | null;
  updated_at: string;
}

// Payload del artefacto de copy (paso ②) — espejo de pipeline-worker/src/steps/copy.ts
export interface CopySection {
  name: string;
  heading: string;
  body: string;
  keywords: string[];
}
export interface CopyPage {
  page: string;
  title: string;
  meta: string;
  h1: string;
  sections: CopySection[];
}
export interface CopyResult {
  pages: CopyPage[];
}

// Payload del artefacto de keyword research (paso ①) — espejo de pipeline-worker/src/steps/keywords.ts
export interface KeywordMetric {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  intent: string | null;
  cpc: number | null;
}
export interface KeywordPage {
  page: string;
  keywords: KeywordMetric[];
}
export interface KeywordResearch {
  source: string;
  enriched: boolean;
  pages: KeywordPage[];
}

export interface Artifact {
  id: string;
  project_id: string;
  step: number;
  type: ArtifactType;
  label: string;
  url: string | null;
  payload: unknown | null;
  created_at: string;
}

// Estado de un proyecto derivado de sus step_states. Precedencia:
// error > revisión > completado > en curso > sin empezar.
export type PipelineStatus = "error" | "needs_review" | "done" | "running" | "pending";

export function pipelineStatus(statuses: string[], total: number): { done: number; status: PipelineStatus } {
  let done = 0;
  let error = false;
  let review = false;
  for (const s of statuses) {
    if (s === "done") done++;
    else if (s === "error") error = true;
    else if (s === "needs_review") review = true;
  }
  const status: PipelineStatus = error
    ? "error"
    : review
    ? "needs_review"
    : done >= total
    ? "done"
    : done > 0
    ? "running"
    : "pending";
  return { done, status };
}

export const PIPELINE_STATUS_LABEL: Record<PipelineStatus, string> = {
  error: "error",
  needs_review: "revisión",
  done: "completado",
  running: "en curso",
  pending: "sin empezar",
};
