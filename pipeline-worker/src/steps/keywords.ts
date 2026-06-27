import { completeJson } from "../llm.js";
import { env } from "../env.js";
import type { Project } from "../types.js";

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
  enriched: boolean; // true = con métricas de SE Ranking; false = solo candidatas
  pages: KeywordPage[];
}

// Códigos de intención de SE Ranking → etiqueta legible.
const INTENT: Record<string, string> = {
  I: "Informacional",
  N: "Navegacional",
  C: "Comercial",
  T: "Transaccional",
};

export async function researchKeywords(project: Project): Promise<KeywordResearch> {
  const source = env.SERANKING_SOURCE;
  const seeds = await proposeKeywords(project, source);

  if (!env.SERANKING_API_KEY) {
    return {
      source,
      enriched: false,
      pages: seeds.map((p) => ({
        page: p.page,
        keywords: p.keywords.map(blank),
      })),
    };
  }

  const all = [...new Set(seeds.flatMap((p) => p.keywords))];
  const metrics = await enrich(all, source);
  return {
    source,
    enriched: true,
    pages: seeds.map((p) => ({
      page: p.page,
      keywords: p.keywords.map((k) => metrics.get(k.toLowerCase()) ?? blank(k)),
    })),
  };
}

function blank(keyword: string): KeywordMetric {
  return { keyword, volume: null, difficulty: null, intent: null, cpc: null };
}

// Claude propone páginas + keywords candidatas a partir del contexto del proyecto.
async function proposeKeywords(
  project: Project,
  source: string
): Promise<{ page: string; keywords: string[] }[]> {
  const prompt = `Proyecto: ${project.name}${project.domain ? ` (${project.domain})` : ""}.
${project.briefing_doc_urls?.length ? `Briefing: ${project.briefing_doc_urls.join(", ")} (sin acceso directo; infiere por nombre/dominio).` : ""}
Mercado/idioma: base regional "${source}".

Propón la arquitectura de páginas de una web de servicios para este negocio y, por página,
8-15 keywords candidatas reales (lo que buscaría un cliente en ese mercado), mezclando
cabeza y cola larga. No inventes marcas; usa términos genéricos del sector y la localidad si la hay.

Devuelve EXCLUSIVAMENTE JSON válido, sin texto ni bloques de código:
{"pages":[{"page":"Inicio","keywords":["...","..."]}]}`;

  const text = await completeJson(prompt);

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("La respuesta del modelo no contenía JSON.");
  const parsed = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(parsed.pages)) throw new Error("JSON sin array 'pages'.");
  return parsed.pages;
}

// SE Ranking Data API: enriquece una lista de keywords con volumen/dificultad/intención.
async function enrich(keywords: string[], source: string): Promise<Map<string, KeywordMetric>> {
  const res = await fetch(
    `https://api.seranking.com/v1/keywords/export?source=${encodeURIComponent(source)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${env.SERANKING_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keywords }),
    }
  );
  if (!res.ok) throw new Error(`SE Ranking ${res.status}: ${await res.text()}`);

  const rows = (await res.json()) as Array<{
    keyword?: string;
    volume?: number;
    difficulty?: number;
    cpc?: number;
    intents?: string[];
  }>;

  const map = new Map<string, KeywordMetric>();
  for (const r of rows) {
    if (!r.keyword) continue;
    map.set(r.keyword.toLowerCase(), {
      keyword: r.keyword,
      volume: r.volume ?? null,
      difficulty: r.difficulty ?? null,
      cpc: r.cpc ?? null,
      intent: Array.isArray(r.intents) ? r.intents.map((c) => INTENT[c] ?? c).join(" / ") : null,
    });
  }
  return map;
}
