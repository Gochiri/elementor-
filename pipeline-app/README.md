# Pipeline — app de orquestación del flujo web (Ómibu/SEMIA)

App web para gestionar la producción de webs por cliente: pegar los links del cliente, ver
el estado de los 8 pasos del pipeline (briefing → keyword research → copy → wireframes →
Figma → hi-fi → Elementor → verificación) y, en fases siguientes, ejecutarlos con un agente.

**Esto es la Fase 0:** login por usuario, proyectos CRUD y el tablero de 8 pasos (estados +
artefactos visibles). La ejecución automática llega en Fase 1+ (worker aparte). Ver el plan
en `~/.claude/plans/` y el contexto en `../CLAUDE.md`.

## Stack

- **Next.js 14** (App Router, TypeScript) → desplegable en **Vercel**.
- **Supabase** (Auth por usuario + Postgres + RLS). Realtime/Storage se usan en fases siguientes.
- Estilos: CSS plano con tokens **OKLCH** de la marca (sin Tailwind/build extra).

## Puesta en marcha

1. **Crear proyecto Supabase** (supabase.com) → copia la *Project URL* y la *anon key*
   (Project Settings → API).
2. **Esquema:** en Supabase → SQL Editor, ejecuta `supabase/schema.sql` y luego
   `supabase/seed.sql` (siembra el proyecto Ágave Azul con sus links y estado real).
3. **Variables de entorno:** copia `.env.example` a `.env.local` y rellena
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Instalar y correr:**
   ```bash
   npm install
   npm run dev      # http://localhost:3000
   ```
5. **Primer usuario:** abre `/login` → "No tengo cuenta" → crea tu cuenta. (Si tu Supabase
   exige confirmación por email, desactívala en Auth → Providers → Email para pruebas, o
   confirma desde el correo.)

## Deploy en Vercel

1. Importa este subdirectorio (`pipeline-app/`) como proyecto en Vercel (Root Directory =
   `pipeline-app`).
2. Define las env vars `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Deploy. En Supabase → Auth → URL Configuration, añade la URL de Vercel a *Redirect URLs*.

## Estructura

```
app/
  login/page.tsx           login/registro (cliente)
  projects/page.tsx        lista + alta de proyectos
  projects/[id]/page.tsx   detalle: links del cliente + tablero de 8 pasos
  projects/actions.ts      server actions (crear proyecto, salir)
components/
  TopNav.tsx · StepBoard.tsx
lib/
  types.ts                 PIPELINE_STEPS (8) + tipos
  supabase/                clientes ssr (server/client/middleware)
supabase/
  schema.sql · seed.sql
middleware.ts              protege rutas (redirige a /login sin sesión)
```

## Próximas fases (ver plan aprobado)

- **Fase 1:** worker (Render) con Claude Agent SDK → ejecutar ① SE Ranking + ② copy y
  renderizar los artefactos. Reutiliza como "recetas" las skills de
  `.claude/skills/figma-to-elementor/` y el formato de `docs/seo/*`.
- **Fase 2-3:** ③ wireframes (preview iframe) y ④ captura a Figma (Playwright + gotcha
  `about:blank`).
- **Fase 4:** ⑤ gate humano (branding de Alberto) + ⑥ IR + ⑦ build en Elementor v4 (staging).
