import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { complete } from "../llm.js";
import type { CopyResult, CopyPage } from "./copy.js";

export interface WireframeResult {
  html: string;
  pageCount: number;
  mode?: string;
}

interface Section {
  name: string;
  heading: string;
  body: string;
  keywords: string[];
}

// CSS de respaldo. La fuente de verdad es el bloque ```css de la skill copy-to-wireframe;
// el worker lo lee con loadStyle() y sólo cae aquí si no encuentra el fichero.
const EMBEDDED_STYLE = `:root{--g0:#fff;--g1:#f6f6f5;--g2:#eceae8;--g4:#c7c5c1;--g5:#8a8884;--g6:#3f3d39;--ink:#2a2824;--line:#e4e2de;--mono:ui-monospace,Menlo,Consolas,monospace;--sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--wrap:1080px;}
*{box-sizing:border-box;margin:0;}
body{font-family:var(--sans);background:var(--g2);color:var(--ink);line-height:1.6;}
.board{max-width:var(--wrap);margin:0 auto;padding:32px 20px 96px;}
.pagewrap{margin-bottom:56px;}
.vhead{display:flex;gap:12px;align-items:baseline;margin-bottom:14px;}
.vhead .vn{font:700 12px var(--mono);background:var(--g6);color:#fff;padding:3px 8px;border-radius:4px;}
.vhead h2{font-size:18px;font-weight:700;}
.frame{background:var(--g0);border:1px solid var(--line);border-radius:10px;overflow:hidden;}
.sec{padding:56px;border-bottom:1px solid var(--line);}
.sec:last-child{border-bottom:0;}.sec.tint{background:var(--g1);}
.eyebrow{display:block;font:600 11px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--g5);margin-bottom:14px;}
.h1wf{font-weight:700;font-size:34px;line-height:1.15;letter-spacing:-.02em;max-width:18ch;}
.h2wf{font-weight:700;font-size:24px;line-height:1.2;letter-spacing:-.01em;max-width:22ch;}
.h3wf{font-weight:650;font-size:16px;}
.copy{font-size:14px;color:var(--g5);max-width:48ch;margin-top:14px;}
.btn{display:inline-flex;align-items:center;border:1px solid var(--g6);color:var(--g6);font:600 13px var(--sans);padding:11px 18px;border-radius:6px;}
.btn.solid{background:var(--g6);color:#fff;}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:24px;}
.grid{display:grid;gap:28px;}
.ph{border:1px solid var(--line);background:var(--g1);display:grid;place-content:center;color:var(--g5);font:600 11px var(--mono);letter-spacing:.04em;border-radius:8px;text-align:center;padding:12px;min-height:160px;}
.ico{width:44px;height:44px;border:1px solid var(--g4);border-radius:8px;background:var(--g1);margin-bottom:14px;}
.feat{display:grid;gap:6px;align-content:start;}
.small{font-size:12px;color:var(--g5);margin-top:4px;}
.navwf{display:flex;align-items:center;gap:16px;}.navwf .logo{font-weight:700;font-size:15px;}
.navwf .nlinks{display:flex;gap:16px;margin-left:auto;flex-wrap:wrap;font-size:12px;color:var(--g5);}
.field{border:1px solid var(--line);border-radius:6px;padding:11px 12px;font-size:12px;color:var(--g5);background:var(--g0);}
.formbox{border:1px solid var(--line);border-radius:10px;padding:20px;background:var(--g1);}
.formgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;}`;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Copia breve: una frase, máx ~110 car. Es un wireframe, no la web final.
function short(body: string): string {
  const first = body.split(/(?<=[.!?])\s/)[0] ?? body;
  const t = first.length > 110 ? first.slice(0, 107).trimEnd() + "…" : first;
  return esc(t);
}

type Layout = "hero" | "grid" | "feature" | "map" | "cta" | "text";

function classify(name: string, i: number): Layout {
  if (i === 0) return "hero";
  const n = name.toLowerCase();
  if (/(mapa|llegar|direcci[oó]n|ubicaci[oó]n|d[oó]nde estamos)/.test(n)) return "map";
  if (/(carta|men[uú]|producto|galer[ií]a|tipos|eventos|platos|antojito|bebida|entrante|especialidad)/.test(n)) return "grid";
  if (/(servicio|ventaja|por qu[eé]|porqu[eé]|proceso|c[oó]mo funciona|beneficio|garant[ií]a|caracter[ií]stica)/.test(n)) return "feature";
  if (/(cta|reserv|contact|presupuesto|vis[ií]t|pedir|solicita|llama|compra)/.test(n)) return "cta";
  return "text";
}

function renderSection(s: Section, i: number): string {
  const eyebrow = `<span class="eyebrow">${esc(s.name)}</span>`;
  const head = `<div class="${i === 0 ? "h1wf" : "h2wf"}">${esc(s.heading)}</div>`;
  const copy = `<p class="copy">${short(s.body)}</p>`;

  switch (classify(s.name, i)) {
    case "hero":
      return `<div class="sec"><div class="grid" style="grid-template-columns:1fr 1fr;align-items:center;"><div>${eyebrow}${head}${copy}<div class="row"><span class="btn solid">Acción principal</span><span class="btn">Saber más</span></div></div><div class="ph" style="min-height:300px;">Imagen</div></div></div>`;

    case "feature":
      return `<div class="sec">${eyebrow}${head}<div class="grid" style="grid-template-columns:repeat(3,1fr);margin-top:32px;">${["Ventaja", "Ventaja", "Ventaja"]
        .map((t) => `<div class="feat"><div class="ico"></div><div class="h3wf">${t}</div><p class="small">Detalle breve.</p></div>`)
        .join("")}</div></div>`;

    case "grid":
      return `<div class="sec tint">${eyebrow}${head}<div class="grid" style="grid-template-columns:repeat(3,1fr);margin-top:32px;">${[1, 2, 3]
        .map(() => `<div><div class="ph" style="min-height:180px;">Imagen</div><div class="h3wf" style="margin-top:12px;">Elemento</div></div>`)
        .join("")}</div><div class="row"><span class="btn">Ver todo</span></div></div>`;

    case "map":
      return `<div class="sec tint"><div class="grid" style="grid-template-columns:1fr 1fr;align-items:center;"><div>${eyebrow}${head}${copy}<div class="row"><span class="btn solid">Cómo llegar</span></div></div><div class="ph" style="min-height:200px;">Mapa</div></div></div>`;

    case "cta":
      return `<div class="sec tint"><div style="text-align:center;max-width:40ch;margin:0 auto;">${eyebrow}<div class="h2wf" style="max-width:none;">${esc(
        s.heading
      )}</div><p class="copy" style="max-width:none;margin:14px auto 0;">${short(s.body)}</p><div class="row" style="justify-content:center;"><span class="btn solid">Contactar</span><span class="btn">Llamar</span></div></div></div>`;

    default: {
      const cls = i % 2 ? "sec tint" : "sec";
      const text = `<div>${eyebrow}${head}${copy}</div>`;
      const img = `<div class="ph">Imagen</div>`;
      const cols = i % 2 === 0 ? `${img}${text}` : `${text}${img}`;
      return `<div class="${cls}"><div class="grid" style="grid-template-columns:1fr 1fr;align-items:center;">${cols}</div></div>`;
    }
  }
}

function renderPage(page: CopyPage, i: number, links: string, brand: string): string {
  const nav = `<div class="sec" style="padding:18px 56px;"><div class="navwf"><span class="logo">${esc(
    brand
  )}</span><span class="nlinks">${links}</span><span class="btn solid">Reservar</span></div></div>`;
  const secs = page.sections.map((s, j) => renderSection(s as Section, j)).join("");
  const footer = `<div class="sec tint" style="padding:28px 56px;"><div class="navwf"><span class="logo">${esc(
    brand
  )}</span><span class="nlinks">© ${esc(brand)}</span></div></div>`;

  return `<section class="pagewrap" id="p-${slug(page.page)}">
  <div class="vhead"><span class="vn">${i + 1}</span><h2>${esc(page.page)}</h2></div>
  <div class="frame">${nav}${secs}${footer}</div>
</section>`;
}

function wrapDoc(projectName: string, sections: string): string {
  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wireframes · ${esc(projectName)}</title>
<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
<style>${loadStyle()}</style>
</head><body>
<div class="board">
${sections}
</div>
</body></html>`;
}

// Determinista (fallback): aplica las reglas de la skill en código, sin LLM, <1s.
export function generateWireframes(copy: CopyResult, projectName: string): WireframeResult {
  const links = copy.pages.map((p) => esc(p.page)).join(" · ");
  const body = copy.pages.map((p, i) => renderPage(p, i, links, projectName)).join("\n");
  return { html: wrapDoc(projectName, body), pageCount: copy.pages.length, mode: "determinista" };
}

// ── Skill copy-to-wireframe (fuente de verdad de CSS + bloques + reglas) ────────────

const CONCURRENCY = 3;

let _lib: string | null = null;
function getLibrary(): string {
  if (_lib != null) return _lib;
  const here = dirname(fileURLToPath(import.meta.url));
  _lib = readFileSync(
    join(here, "..", "..", "..", ".claude", "skills", "copy-to-wireframe", "references", "component-library.md"),
    "utf8"
  );
  return _lib;
}

function loadStyle(): string {
  try {
    const m = getLibrary().match(/```css\n([\s\S]*?)```/);
    if (m) return m[1];
  } catch {
    /* sin fichero: usamos el embebido */
  }
  return EMBEDDED_STYLE;
}

function extractSection(text: string, slugId: string): string {
  const start = text.indexOf("<section");
  const end = text.lastIndexOf("</section>");
  if (start === -1 || end === -1) throw new Error("La respuesta no contenía <section>.");
  const html = text.slice(start, end + "</section>".length);
  if (!html.includes(`id="p-${slugId}"`)) throw new Error(`<section> sin id p-${slugId}.`);
  return html;
}

async function sectionForPage(
  lib: string,
  page: CopyPage,
  i: number,
  links: string,
  projectName: string
): Promise<string> {
  const id = slug(page.page);
  const prompt = `Eres maquetador de wireframes lo-fi tipo Relume: limpio, aireado, gris, sin branding.
Usa EXCLUSIVAMENTE las clases de esta librería; no inventes CSS ni estilo inline salvo grid-template-columns, min-height de .ph, max-width, text-align, justify-content y margin auto.

## Librería de componentes
${lib}

## Página a maquetar (JSON)
${JSON.stringify(page)}

## Contexto
Marca: ${projectName}. Enlaces de nav: ${links}. Número de página: ${i + 1}. Slug: ${id}.

## Reglas de densidad (IMPORTANTE)
- Copia BREVE: resume cada body a UNA frase de ≤14 palabras. Es un wireframe, no la web final.
- NO incluyas keywords ni líneas SEO ni la línea title/meta. Sin ruido.
- Secciones de servicios/ventajas/proceso/por qué → bloque icon-feature (con .ico).
- Secciones de carta/menú/productos/galería → grid de tarjetas con .ph etiquetados con el contenido real.
- Cada imagen/mapa = un .ph con etiqueta corta (1-3 palabras del contenido).

## Tarea
Devuelve SOLO el bloque HTML de ESTA página, sin texto antes ni después, sin bloques de código:
<section class="pagewrap" id="p-${id}"><div class="vhead"><span class="vn">${i + 1}</span><h2>${esc(
    page.page
  )}</h2></div><div class="frame"> nav · bloques · footer </div></section>`;

  const out = await complete(prompt);
  return extractSection(out, id);
}

async function generateViaLLM(copy: CopyResult, projectName: string): Promise<string> {
  const lib = getLibrary();
  const links = copy.pages.map((p) => esc(p.page)).join(" · ");
  const sections: string[] = [];

  let next = 0;
  async function worker() {
    while (next < copy.pages.length) {
      const idx = next++;
      sections[idx] = await sectionForPage(lib, copy.pages[idx], idx, links, projectName);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, copy.pages.length) }, worker));

  return wrapDoc(projectName, sections.join("\n"));
}

// Híbrido: intenta el modo LLM (skill, content-aware); si falla, cae al determinista.
export async function buildWireframes(copy: CopyResult, projectName: string): Promise<WireframeResult> {
  try {
    const html = await generateViaLLM(copy, projectName);
    return { html, pageCount: copy.pages.length, mode: "skill-llm" };
  } catch (e) {
    const r = generateWireframes(copy, projectName);
    return { ...r, mode: `fallback determinista (${e instanceof Error ? e.message : String(e)})` };
  }
}
