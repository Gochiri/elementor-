# Proyecto Elementor — Automatización del flujo web (Ómibu/OVNIA → SEMIA)

> Contexto vivo del proyecto. Léeme al empezar una sesión. Última actualización: 2026-06-26.

## Qué es esto

Consultoría (**Ómibu / OVNIA** — Germán, Henry, Oliver) que asesora al departamento web
de la agencia **SEMIA** (Fran dirige, Senia ejecuta, Alberto diseño/desarrollo) para
**recortar el tiempo de producción de webs de servicios de 6-8 h → ~4 h**, sin romper la
fase manual de diseño de Alberto.

**Caso piloto real en curso: Ágave Azul** (restaurante mexicano + obrador de tortillas de
maíz sin gluten, Santander).

## Flujo objetivo (Fase 1, conserva Figma)

```
Briefing del cliente
 → ① Keyword research SEO (SE Ranking MCP) + copy por secciones (sin corte 5.000 char de Relume)
 → ② Wireframes HTML lo-fi con el copy ya colocado
 → ③ Captura HTML→Figma (frames editables) → equipo elige/edita estructura
 → ④ Hi-fi: diseñador aplica branding + tokens + sistema de diseño  ← valor de Alberto
 → ⑤ skill figma-to-elementor → Elementor v4 atómico, nativo, autogestionable
 → ⑥ Verificación visual
```

Fase 2 (experimental, staging, NO se promete al cliente): brief → Elementor directo, sin Figma.

## Estado actual (2026-06-26)

Recorrido hecho para Ágave Azul: ① keyword research ✅ · ② copy por secciones ✅ ·
③ wireframes en HTML ✅ · ④ captura a Figma ✅. **Etapa actual: ⑤ branding/hi-fi en Figma**,
y luego ⑥ a Elementor.

En paralelo, la **app** (ver sección abajo) ya corre en local contra Supabase con ①②③
automatizados por el worker (LLM gratis vía Max) y el resto como fases siguientes.

El trasvase Figma→Elementor solo está validado en **otro** caso (hero Ómibu), todavía no en
Ágave Azul.

### Resultado final que esperamos
1. **Web completa de Ágave Azul** (8 páginas) maquetada en **Elementor v4 atómico**, 100%
   editable/autogestionable por el cliente (sin código pegado), partiendo del Figma hi-fi.
2. **Flujo procedimentado y testeado** que baje un proyecto "S" de 6-8 h → ≤ 4 h, medido en
   staging, listo para presentar a Fran como primer paso (no solución definitiva).
3. Aprendizajes registrados en el skill `figma-to-elementor` para converger más rápido en el
   siguiente proyecto.

## La app (pipeline-app + pipeline-worker) — el flujo manual convertido en producto

El pipeline manual (esta misma sesión de Claude paso a paso) ya tiene una **app desplegable**
que el equipo (Senia/Alberto) usa por cliente. Roadmap completo en
`docs/superpowers/plans/2026-06-22-automatizacion-flujo-web-plan.md`.

- **`pipeline-app/`** — Next.js 14 (App Router, `force-dynamic`, server actions) + **Supabase**
  (Auth, Postgres, RLS con claves NUEVAS `sb_publishable_` / `sb_secret_`). Login por usuario,
  CRUD de proyectos, **tablero de 8 pasos** con estados leídos de la DB, visores internos
  (keywords, copy, wireframes) y **Figma embebido** en iframe. Cada campo de links del cliente
  acepta **varios links** (columnas `text[]`: `briefing_doc_urls`, `structure_sheet_urls`,
  `relume_urls`). Esquema en `supabase/schema.sql`; reset en `supabase/reset.sql`; seed Ágave
  Azul en `supabase/seed.sql`. Frontend con clases `ops-*` (rediseño del usuario — no revertir).
- **`pipeline-worker/`** — worker Node (tsx watch) que sondea `step_states` en `running`,
  despacha por paso y escribe artefactos. Pasos automatizados hoy: **① keyword research
  (SE Ranking Data API REST) · ② copy por secciones · ③ wireframes HTML** (reusa el CSS/bloques
  de la skill `copy-to-wireframe` como fuente de verdad). ⑤ hi-fi es **gate de aprobación
  humana** (botón "Aprobar"); ④ captura Figma y ⑥⑦ Elementor son fases siguientes.

### Gotchas de la app/worker (clave)
- **LLM gratis vía suscripción Max, NO API key:** `pipeline-worker/src/llm.ts` invoca el binario
  `claude` (CLI headless) en vez del SDK de Anthropic. Si `ANTHROPIC_API_KEY` está vacía usa el
  CLI (suscripción Max/Pro, sin coste por token). Sutilezas Windows resueltas: (1) spawnear el
  binario **directo, sin `shell:true`** (cmd.exe rompe el EOF de stdin con prompts grandes →
  cuelgue); ruta vía `where claude` → línea `.exe`. (2) flags `--strict-mcp-config
  --setting-sources=` saltan MCP/skills/hooks (arranque de >60s a ~4s). (3) `--setting-sources=`
  como **un solo token** (con `=`), no `--setting-sources ""` (el arg vacío se pierde en spawn).
  (4) **una página por llamada** con `CONCURRENCY=3` (las 8 en una sola llamada rozan el timeout
  de 240s). (5) `--system-prompt` para quitar el marco "agente de código" + `completeJson()` con
  reintento ×3 contra respuestas intermitentes en prosa sin JSON.
- **Un solo `next dev` a la vez.** Varios servers pelean por `.next` → "Cannot find module
  './vendor-chunks/@supabase.js'" o "Jest worker… child process exceptions". Arreglo: parar dev,
  `Remove-Item -Recurse -Force .next`, reiniciar. Para type-check sin tocar `.next`: `npx tsc --noEmit`.
- **No `npm run build` mientras corre `next dev`** (corrompe el `.next` compartido).
- **`SUPABASE_SERVICE_ROLE_KEY` solo en servidor** (worker/`.env`), nunca en cliente. `.env*`
  fuera del repo. (El `sb_secret` se filtró al transcript de una sesión → rotar cuando se pueda.)

## Estructura del sitio (fuente de verdad = hoja del equipo)

Hoja oficial de estructura (Senia/Alberto):
`https://docs.google.com/spreadsheets/d/1Ss0YtWYPeykajQWBs0try5cLd6Fp5SZO`

8 páginas: **Inicio · Carta · El Restaurante · Obrador · Catering · Foodtruck · Blog · Contacto**.
Los wireframes v3 ya están alineados a esta hoja (secciones, nombres, orden y formularios).

## Archivos clave

- `docs/seo/2026-06-23-agave-azul-brief-arquitectura.md` — keyword research (SE Ranking) +
  content brief por página (pillar/spoke, volúmenes, dificultad, intención).
- `docs/seo/2026-06-23-agave-azul-copy-inicio-obrador.md` — copy final por secciones de las
  7 páginas (versión Claude, rama B del piloto).
- `mockups/agave-azul/wireframes-sitio.html` — wireframes del sitio (HTML lo-fi, se sirve por
  HTTP para capturar a Figma). **Estado: v3 alineado a la hoja.**
- `mockups/agave-azul/wireframes-inicio.html` — 5 variantes de Inicio (exploración previa).
- `docs/superpowers/plans/2026-06-22-automatizacion-flujo-web-plan.md` — plan + roadmap técnico.
- `docs/superpowers/propuestas/2026-06-22-propuesta-fran-flujo-web.md` — propuesta de negocio
  para Fran (3 ideas, por fases).
- `docs/superpowers/plans/2026-06-22-piloto-relume-vs-claude.md` — piloto A/B con resultados.
- `.claude/skills/figma-to-elementor/` — skill validado (trasvase Figma→Elementor v4). Ver
  `references/html-to-figma-capture.md` (etapa wireframe→Figma) e `references/ir-schema.md`
  (Section Plan / IR, formato puente).

## Figma (cuenta ómibu, plan `team::1334803630221203753`)

- v1 corto: `4IbE3vPXMBO4h6w6JcqqPt` (descartable)
- v2 extendido: `MEpJs0I8q0jrv6fftHTBKh` (descartable)
- **v3 alineado a la hoja (canónico):** `aWOSRO4MJuFPFTGjQkjSFW`
  - Inicio `1-2` · Carta `2-2` · Restaurante `4-2` · Obrador `5-2` · Catering `6-2` ·
    Foodtruck `7-2` · Blog `8-2` · Contacto `9-2`

## Piloto Relume vs Claude (decisión)

**Híbrido:** Claude para estructura + SEO + copy (gana en fidelidad SEO, limpieza, menos
retoque); Relume opcional solo como explorador visual de bloques. Relume genera páginas más
largas con más bloques (parte aporta, parte relleno con `.` vacíos/erratas) y sin capa SEO.

## Gotchas / cómo trabajar

- **Captura HTML→Figma:** servir el HTML por `python -m http.server 8765` y capturar con el
  MCP de Figma (`generate_figma_design` → captureId → navegar a URL con `#figmacapture=...&
  figmaendpoint=...&figmadelay=1500&figmaselector=%23p-<page>%20.frame` → poll hasta
  `completed`). **Reset entre capturas: `about:blank` con el Playwright MCP standalone
  (`plugin_playwright_playwright`), NO con claude-in-chrome** (rechaza `about:blank` y solo
  deja la 1ª captura; las siguientes se cuelgan en `pending`). El Playwright extensión-bridge
  (`plugin_ecc_playwright`) da timeout. Receta completa en
  `.claude/skills/figma-to-elementor/references/html-to-figma-capture.md`.
- **SE Ranking:** plugin oficial `seranking/seo-skills` (OAuth vía `/mcp`, cuenta ya pagada).
- **Briefing manda sobre detalles:** NO nombrar Just-Eat como canal de pedidos (sí decir
  "domicilio y para recoger"). Tono profesional. Dos fichas NAP (Restaurante + Obrador).
- **Elementor v4 atómico** está en beta/rollout 2026; trabajar en staging. Workarounds del
  skill: CSS por `[data-id]`, imagen como background, etc.
- **Credenciales** (SE Ranking, WP Application Password) fuera del repo.

## Pendiente / a confirmar con el cliente

- **Dominio**, **emails** reales (puse placeholders `hola@`/`obrador@agaveazul.es`) y
  **horarios** del restaurante/obrador.
- **Branding/hi-fi** en Figma sobre la estructura v3 aprobada → luego a Elementor.
- **Blog:** redactar los posts TOFU (cochinita pibil, totopos, tortilla de maíz,
  nixtamalización, tequila…) cuando toque.
- Cronometrar el flujo completo contra las 6-8 h actuales y registrar % de secciones que
  abren 100% editables en Elementor.
