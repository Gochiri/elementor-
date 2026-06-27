# Automatización del flujo web en Elementor — Propuesta (Fran, lunes) + Roadmap técnico

## Contexto

**Quiénes:** la consultoría (Germán/OVNIA, Henry, Oliver) asesora al departamento web de la agencia (SEMIA: Senia ejecuta, Alberto diseño/desarrollo, Fran dirige).

**Problema (de la llamada 19-jun):** el flujo de Senia toma **6-8 h/proyecto** y es frágil. Cadena actual:
`Briefing → Excel estructura → GEM Gemini (prompt) → Relume (wireframe+copy) → edición manual → Figma → Elementor MANUAL`.

Eslabones débiles detectados:
- **GEM de Gemini**: paso manual de copiar briefing+estructura para que escupa un prompt.
- **Relume**: corta el prompt a **5.000 caracteres** (se pierde info) y exporta sucio a Figma (contenido duplicado, Lorem Ipsum, bloques que no se pueden borrar en Relume).
- **Keyword research (SE Ranking)**: se hace **manual y aparte**, no alimenta la generación.
- **Figma → Elementor**: 100% manual, **la parte más tediosa** (probaron UiChemy en su día).

**Tensión del equipo (sin resolver en la llamada):** Henry quiere eliminar Figma; **Alberto lo quiere conservar** como capa de sistema de diseño + tokens + aprobación visual del cliente. Fran pide ir **de fácil a complejo, en doble fase, procedimentado y testeado**, empezando por una web de servicios "S" sin integraciones.

**Activo que ya existe:** el skill **`figma-to-elementor`** (repo Elementor, ya en GitHub) está **validado en producción** (hero omibu) y resuelve precisamente la pieza del trasvase Figma→Elementor v4 atómico, nativo y autogestionable.

**Meta:** bajar de 6-8 h → **4 h**, centralizado, testeable, **compatible con la fase manual de Alberto**.

**Entregable inmediato:** correo a Fran **el lunes** con 2-3 ideas concretas de automatización (SEO + trasvase). *Excluye el plugin de mantenimiento de Oliver (es otro tema: backups WordPress).*

**Decisiones tomadas (esta sesión):**
- Figma: **por fases** — conservar en Fase 1, pilotar ruta sin Figma en Fase 2.
- Relume: **probar ambos** (Relume vs Claude) y comparar en el piloto.
- Entregable: **propuesta para Fran + roadmap técnico**.

---

## Workflow objetivo

### Fase 1 (conserva Figma — baja fricción, postura de Alberto)
```
Briefing del cliente
   ↓
① CLAUDE (orquestador) + SE Ranking (MCP oficial)
   → keyword research SEO automática (ya pagan SE Ranking)
   → estructura por bloques + copy SEO, por secciones, SIN corte de 5.000 char
   ↓  (consolida/elimina el GEM de Gemini)
② WIREFRAMES con copy (reemplaza la etapa de wireframe de Relume)
   → Claude genera 4-5 variantes de wireframe en HTML lo-fi (gris) con el copy+SEO YA colocado
   → captura HTML→Figma como frames editables → cliente/equipo elige y aprueba la estructura
   ↓
③ FIGMA hi-fi — diseñador aplica SISTEMA DE DISEÑO + tokens sobre la variante aprobada
   y consigue aprobación visual del cliente   ← valor de Alberto
   ↓
④ SKILL figma-to-elementor (YA validado)
   → Elementor v4 atómico, nativo, autogestionable
   ↓
⑤ Verificación visual + refinamiento
```

> **Validado 2026-06-24 (caso Ágave Azul):** ① keyword research + copy con SE Ranking; ②
> 5 variantes de wireframe **con copy** empujadas a Figma como frames editables (el equipo
> elige/edita ahí, como en Relume pero con el copy+SEO ya colocado). La captura HTML→Figma
> usa `generate_figma_design`. **Gotcha:** navegar cambiando solo el `#hash` no recarga la
> página → la captura se cuelga en `pending`; **resetear a `about:blank` antes de cada
> captura**. No usar `browser_evaluate`+`fetch` (cuelga). Receta completa en
> `.claude/skills/figma-to-elementor/references/html-to-figma-capture.md`.

### Fase 2 (piloto en paralelo, en staging — NO se promete al cliente aún)
- **brief → Elementor directo** (sin Figma): la "Phase 2" que el skill ya tiene documentada (entrada por IR/JSON en vez de nodo Figma).
- **Bloques Elementor reutilizables** (hero, servicios, CTA, pricing) como plantillas JSON que el cliente añade con un clic — materializa la idea de Alberto de "secciones predefinidas con campos que solo se rellenan".

---

## Entregable A — Propuesta para Fran (correo del lunes)

Documento breve, orientado a negocio/proceso. Estructura:

1. **Diagnóstico del flujo actual** (cadena + dónde se va el tiempo y dónde se pierde info). 1 párrafo + el diagrama "hoy".
2. **3 ideas de automatización**, cada una con qué elimina, qué conserva y ahorro estimado:
   - **Idea 1 — Keyword research conectado (SE Ranking vía MCP).** Deja de ir "aparte"; alimenta la estructura+copy automáticamente. Mantiene el proveedor de datos actual.
   - **Idea 2 — Consolidar Gemini en Claude y reemplazar/aliviar Relume.** Generar estructura+copy por secciones, sin el corte de 5.000 char. (En piloto se mide Relume vs Claude.)
   - **Idea 3 — Trasvase Figma→Elementor automatizado** con el skill ya validado (autogestionable, sin código pegado).
3. **Enfoque por fases** (respeta a Alberto y el "doble fase" de Fran): Fase 1 conserva Figma como sistema de diseño/aprobación; Fase 2 pilota la ruta sin Figma en staging.
4. **Compromiso de medición** (umbrales abajo) — no promesas de marketing, se valida en staging con un caso real.
5. **Qué necesitamos de ellos:** el briefing + prompt/output de Relume del caso de prueba (Kau Interiorismo / Asesoría Energética Santander) que ya quedaron en enviar.

Tono: "primer paso testeado", no solución definitiva. Sin jerga técnica (nada de MCP/IR en el cuerpo; va en anexo si acaso).

**Ubicación sugerida:** `docs/superpowers/propuestas/2026-06-22-propuesta-fran-flujo-web.md`.

---

## Entregable B — Roadmap técnico

Reutiliza el contrato y las piezas que **ya existen** en `.claude/skills/figma-to-elementor/`:
- `references/ir-schema.md` — el **Section Plan (IR)** es el formato puente. Es también la salida natural de "brief→estructura/copy" y la entrada de la Fase 2 (brief→Elementor). **Reutilizar, no reinventar.**
- `references/mapping-table.md`, `references/verification-loop.md`, `references/first-pass-playbook.md`, `references/figma-heuristics.md` — sin cambios; los consume el builder/verificación.
- `SKILL.md` — añadir la entrada Fase 2 (ya documentada como pendiente).

**Piezas nuevas a construir (orden):**

1. **SE Ranking — usar el plugin oficial (no construir desde cero).**
   - Existe `seranking/seo-skills`: **26 skills oficiales** (content brief con keyword research + SERP, clustering pillar/spoke, auditorías…) sobre el MCP de SE Ranking. **Auth OAuth** vía `/mcp` (sin API key a mano); requiere cuenta SE Ranking con acceso API.
   - Instalación: `/plugin marketplace add seranking/seo-skills` + `/plugin install seo-skills@seranking`.
   - **No** construimos `references/seo-keyword-research.md` ni research propio: lo cubre SE Ranking. (El `claude mcp add` suelto se quitó para no duplicar con el del plugin.)

2. **Puente: salida SE Ranking → Section Plan (IR).**
   - Nuestro valor diferencial: adaptador que toma el **content brief + clusters** que genera SE Ranking → **IR** (`ir-schema.md`) con la estructura por secciones → Figma (Fase 1) o Elementor directo (Fase 2).
   - SE Ranking hace SEO + copy; nosotros hacemos el trasvase a Elementor nativo. Sin duplicar trabajo.

3. **Piloto A/B Relume vs Claude** (decisión tomada: comparar).
   - Doc: `docs/superpowers/plans/2026-06-22-piloto-relume-vs-claude.md`.
   - Mismo briefing → (A) prompt mejorado a Relume, (B) Claude genera estructura+copy. Medir retoque manual, fidelidad SEO, tiempo.

4. **Fase 2 — brief→Elementor directo** (staging): activar la entrada IR→Elementor del skill, sin Figma.

5. **Bloques Elementor reutilizables**: estandarizar plantillas JSON (hero/servicios/CTA) — `references/bloques-reutilizables.md` + JSONs.

**Archivos clave:**
- A modificar: `.claude/skills/figma-to-elementor/SKILL.md` (entrada Fase 2).
- A crear: el **adaptador SE Ranking → IR**, `references/bloques-reutilizables.md`, y los 2 docs de plan/piloto.
- A reutilizar tal cual: `references/ir-schema.md` y el resto de referencias.
- SE Ranking (keyword research + content brief): **plugin oficial `seranking/seo-skills`**, no se construye.

---

## Umbrales de adopción (medibles, en staging)

- **Fase 1 completa:** un proyecto de servicios "S" de **6-8 h → ≤ 4 h**.
- **Keyword research conectado:** keywords con volumen/dificultad/intención dentro de la estructura **sin paso manual de copiar/pegar**.
- **Estructura+copy:** el wireframe/copy generado requiere **< 30 min** de retoque y **sin pérdida de info** por límite de caracteres.
- **Trasvase:** la página abre **100% editable/autogestionable** en Elementor (sin bloques de código pegado) en **≥ 90%** de las secciones.
- **Fase 2 (piloto):** brief→Elementor directo abre limpio en staging; si no alcanza el umbral en 2026, Fase 1 queda como producción y Fase 2 sigue como experimento.

---

## Verificación end-to-end

1. **Caso real:** usar el briefing que SEMIA enviará (Kau Interiorismo / Asesoría Energética Santander).
2. **Fase 1:** correr ① (SE Ranking + estructura/copy) → revisar IR contra `ir-schema.md` → ② maqueta mínima en Figma con tokens → ③ skill `figma-to-elementor` a una página de staging → ④ verificación visual (`verification-loop.md`).
3. **Cronometrar** contra las 6-8 h actuales y registrar el % de secciones que abren 100% editables.
4. **Piloto Relume A/B:** mismo briefing por ambas vías; tabla comparativa de retoque/fidelidad/tiempo.
5. **Registrar aprendizajes** en el skill (memorias/refs) para converger más rápido en el siguiente proyecto.

---

## Riesgos / cuidados

- **No prometer de más a Fran:** los conteos de herramientas y "% fidelidad" del reporte vienen de vendors; validar en staging.
- **Compatibilidad con Alberto:** un exceso de automatización en la fase previa de Senia no debe romper su fase manual de diseño. Por eso Fase 1 conserva Figma.
- **Elementor v4 atómico** está en beta/rollout 2026; el skill ya tiene los workarounds validados (CSS por `[data-id]`, imagen como background, etc.). Trabajar en **staging**.
- **Credenciales** (SE Ranking API key, Application Password WP): fuera del repo, como ya se hace.
- **SE Ranking MCP:** si la conexión falla, fallback a la Data API REST (mismo backend).
