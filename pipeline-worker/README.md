# pipeline-worker

Worker de larga duración que ejecuta los pasos **automatizables** del pipeline. Hace _polling_
sobre Supabase: cuando un paso queda en `running` (la app lo marca al pulsar **Ejecutar**), lo
toma, lo ejecuta y guarda el artefacto + el estado final.

## Estado (Fase 1)

| Paso | Qué hace el worker |
|------|--------------------|
| ① Keyword research | ✅ Claude propone páginas + keywords candidatas; si hay `SERANKING_API_KEY`, las enriquece con la Data API (volumen/dificultad/intención). Sin key → `revisión` con candidatas. |
| ② Copy | ✅ Genera copy por secciones (title/meta/H1 + secciones) con Claude. Consume las páginas/keywords del paso ①. |
| ③ Wireframes | ✅ Genera HTML lo-fi determinista desde el copy (sin LLM), con los selectores `#p-<slug> .frame` para reaprovechar en la captura a Figma. |
| ④⑥⑦ | ⏳ `needs_review`: pendientes (Figma, IR, Elementor). |

El paso ② usa solo el SDK de Anthropic (una llamada LLM); no necesita Agent SDK ni navegador.
Eso llega en fases posteriores (③ wireframes, ④ Figma con Playwright, ⑦ Elementor).

## Arrancar en local

```bash
cd pipeline-worker
npm install
cp .env.example .env        # rellena SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
npm run typecheck           # valida tipos
npm run dev                 # arranca el poller (watch)
```

Luego, en la app, abre un proyecto y pulsa **Ejecutar** en el paso ② Copy. El worker lo
detecta en el siguiente _tick_, genera el copy y el tablero pasa a `hecho` con el artefacto.

## Variables de entorno

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — **service role** (bypassa RLS; solo en el worker).
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (por defecto `claude-sonnet-4-6`).
- `POLL_INTERVAL_MS` (por defecto 5000).

## Deploy

Background Worker en **Render/Railway** (no serverless: el worker corre en bucle y, en fases
siguientes, llevará Chromium/Playwright). Comando de arranque: `npm run start`.
