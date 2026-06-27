import { completeJson } from "../llm.js";
import type { Project } from "../types.js";

export interface CopyPage {
  page: string;
  title: string; // <title> SEO ≤ 60 car.
  meta: string; // meta description ≤ 155 car.
  h1: string;
  sections: { name: string; heading: string; body: string; keywords: string[] }[];
}

export interface CopyResult {
  pages: CopyPage[];
}

// Páginas objetivo: vienen del keyword_research (paso ①) si existe; si no, las de abajo.
export interface PageTarget {
  page: string;
  keywords?: string[];
}

const DEFAULT_PAGES: PageTarget[] = [
  { page: "Inicio" },
  { page: "Servicios" },
  { page: "Sobre nosotros" },
  { page: "Contacto" },
];

// Generamos UNA página por llamada (cada una pequeña y rápida) en paralelo limitado.
// Una sola llamada con las 8 páginas tarda ~218s y roza el timeout; por página son ~30-50s.
const CONCURRENCY = 3;

const SYSTEM = `Eres redactor SEO senior para webs de servicios en español (es-ES).
Reglas:
- Tono profesional, claro, orientado a conversión. Nada de relleno ni texto de marcador.
- SEO real: title ≤60 car., meta ≤155 car., un único H1, keywords integradas con naturalidad.
- NO inventes datos del cliente (teléfono, email, dirección, horarios, canales). Si no se dan, deja un placeholder explícito tipo [horario] y no afirmes nada falso.
- Respeta el briefing por encima de cualquier suposición.
Devuelve EXCLUSIVAMENTE JSON válido con el esquema indicado, sin texto antes ni después, sin bloques de código.`;

export async function generateCopy(project: Project, pages: PageTarget[]): Promise<CopyResult> {
  const targets = pages.length ? pages : DEFAULT_PAGES;
  const result: CopyPage[] = [];

  // Pool simple de tamaño CONCURRENCY que mantiene el orden por índice.
  let next = 0;
  async function worker() {
    while (next < targets.length) {
      const idx = next++;
      result[idx] = await generateOnePage(project, targets[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));

  return { pages: result };
}

async function generateOnePage(project: Project, target: PageTarget): Promise<CopyPage> {
  const kw = target.keywords?.length ? ` Keywords objetivo: ${target.keywords.join(", ")}.` : "";
  const briefing = project.briefing_doc_urls?.length
    ? ` Briefing: ${project.briefing_doc_urls.join(", ")} (sin acceso directo; usa placeholders para datos concretos).`
    : "";

  const prompt = `${SYSTEM}

Proyecto: ${project.name}${project.domain ? ` (${project.domain})` : ""}.${briefing}
Redacta el copy de UNA sola página: "${target.page}".${kw}
Incluye 4-6 secciones. Devuelve SOLO este JSON:
{"page":"${target.page}","title":"...","meta":"...","h1":"...","sections":[{"name":"Hero","heading":"...","body":"...","keywords":["..."]}]}`;

  const text = await completeJson(prompt);
  return parseOnePage(text, target.page);
}

// Tolerante: el modelo a veces envuelve el JSON pese a la instrucción.
function parseOnePage(text: string, page: string): CopyPage {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error(`La respuesta no contenía JSON para la página "${page}".`);
  const p = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(p.sections)) throw new Error(`JSON sin 'sections' para la página "${page}".`);
  return {
    page: p.page || page,
    title: p.title || "",
    meta: p.meta || "",
    h1: p.h1 || "",
    sections: p.sections,
  };
}
