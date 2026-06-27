// Mismo modelo de datos que pipeline-app/lib/types.ts (copia mínima; el worker es otro paquete).
export interface StepState {
  id: string;
  project_id: string;
  step: number;
  status: string;
  logs: string | null;
}

export interface Project {
  id: string;
  name: string;
  domain: string | null;
  briefing_doc_urls: string[];
  structure_sheet_urls: string[];
  relume_urls: string[];
}
