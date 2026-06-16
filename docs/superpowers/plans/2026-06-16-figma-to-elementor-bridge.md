# Puente Figma → Elementor — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una skill reutilizable `/figma-to-elementor` que reconstruya páginas completas de Figma en Elementor v4 con fidelidad "fiel + responsive", usando un contrato intermedio (IR) y un loop de verificación visual contra el sitio en vivo.

**Architecture:** Claude actúa como traductor entre dos MCP que no se hablan directamente. Lee Figma (screenshot para intención + metadata/variables para precisión + assets), produce un Plan de Sección (IR en JSON), y lo ejecuta como llamadas atómicas del MCP de Elementor. Trabaja sección por sección con un loop render→comparar→corregir (tope 3 iteraciones).

**Tech Stack:** Skill en Markdown (`.claude/skills/`), Figma MCP, Elementor MCP, navegador headless (Playwright) para verificación. Sin código ejecutable: el entregable son artefactos de prompt/instrucciones.

**Nota de validación:** No hay tests unitarios. Cada tarea define un **criterio de aceptación** verificable por revisión. La prueba integral es la Tarea 10 (dry-run sobre una página real). El directorio no es repo git todavía → la Tarea 0 lo inicializa para que los commits funcionen.

---

### Task 0: Inicializar repo y estructura de la skill

**Files:**
- Create: `.claude/skills/figma-to-elementor/` (directorio)
- Create: `.claude/skills/figma-to-elementor/references/` (directorio)

- [ ] **Step 1: Inicializar git**

```bash
cd "C:/Users/germa/OneDrive/Documents/Elementor"
git init
git add docs/
git commit -m "docs: add figma-to-elementor spec and plan"
```

- [ ] **Step 2: Crear los directorios de la skill**

```bash
mkdir -p .claude/skills/figma-to-elementor/references
```

- [ ] **Step 3: Verificar estructura**

Run: `ls -R .claude/skills/figma-to-elementor`
Expected: muestra el directorio `figma-to-elementor` con subdirectorio `references` (vacío).

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/figma-to-elementor
git commit -m "chore: scaffold figma-to-elementor skill directory"
```

---

### Task 1: Documentar el esquema del IR (Plan de Sección)

El contrato que extractor y constructor deben respetar. Se escribe primero porque las
tareas siguientes lo referencian.

**Files:**
- Create: `.claude/skills/figma-to-elementor/references/ir-schema.md`

- [ ] **Step 1: Escribir el esquema completo del IR**

Contenido del archivo:

````markdown
# Plan de Sección (IR) — Esquema

El contrato intermedio entre Figma y Elementor. El extractor (Unidad 2) lo produce;
el constructor (Unidad 3) lo consume. Un objeto por sección de la página.

## Estructura

```json
{
  "section": "string — nombre legible (hero, features, pricing, footer)",
  "figmaNodeId": "string — id del nodo de Figma, ej. '12:345'",
  "layout": {
    "type": "flexbox",
    "direction": "column | row",
    "gap": "number — px",
    "padding": "[top, right, bottom, left] — px",
    "align": "start | center | end | stretch",
    "justify": "start | center | end | space-between"
  },
  "children": [ "<child> …" ]
}
```

## Tipos de child

```json
{ "type": "heading",   "text": "string", "token": {"typography": "string", "color": "string"} }
{ "type": "paragraph", "text": "string", "token": {"typography": "string", "color": "string"} }
{ "type": "button",    "text": "string", "token": {"color": "string"}, "href": "string" }
{ "type": "image",     "assetId": "string", "fit": "cover | contain", "width": "number|null" }
{ "type": "svg",       "assetId": "string", "width": "number|null" }
{ "type": "flexbox",   "layout": { … }, "children": [ … ] }   // anidado, para sub-grupos
```

## Reglas
- `token.color` y `token.typography` referencian **tokens globales** de Elementor
  (Unidad 0), nunca valores hardcodeados.
- `assetId` referencia un asset ya descargado y subido (Unidad 2) → mapea a URL/ID real.
- Un `flexbox` dentro de `children` permite anidar grupos (ej. una fila de 3 cards).
````

- [ ] **Step 2: Criterio de aceptación**

Revisar que: (a) cada tipo de child del spec aparece, (b) el ejemplo de IR del spec
(`docs/superpowers/specs/2026-06-16-figma-to-elementor-bridge-design.md`) valida contra
este esquema sin campos faltantes, (c) no hay TODO/TBD.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/figma-to-elementor/references/ir-schema.md
git commit -m "docs: add IR (section plan) schema reference"
```

---

### Task 2: Documentar la tabla de mapeo Figma → Elementor v4

**Files:**
- Create: `.claude/skills/figma-to-elementor/references/mapping-table.md`

- [ ] **Step 1: Escribir la tabla de mapeo**

Contenido del archivo:

````markdown
# Mapeo Figma → Elementor v4 (widgets atómicos)

| Figma                          | Elementor atómico                      | Notas |
|--------------------------------|----------------------------------------|-------|
| Frame auto-layout vertical     | `add-flexbox` direction=column         | gap/padding del auto-layout → gap/padding del flexbox |
| Frame auto-layout horizontal   | `add-flexbox` direction=row            | idem |
| Frame sin auto-layout          | `add-div-block`                        | posicionar hijos con flex igualmente; evitar absolutos |
| Texto (estilo heading)         | `add-atomic-heading`                   | nivel H1–H6 según jerarquía Figma |
| Texto (cuerpo)                 | `add-atomic-paragraph`                 | |
| Rectángulo con fill imagen     | `add-atomic-image` + `sideload-image`  | descargar asset primero |
| Vector / icono                 | `add-atomic-svg` + `upload-svg-icon`   | |
| Botón / frame clicable         | `add-atomic-button`                    | texto + href + token color |
| Variable de color              | token global de color (Unidad 0)       | nunca hardcodear hex |
| Variable de tipografía         | token global de tipografía (Unidad 0)  | |

## Equivalencias de alineación

| Figma auto-layout | Flexbox Elementor |
|---|---|
| Align: top/left    | align/justify: start |
| Align: center      | align/justify: center |
| Align: bottom/right| align/justify: end |
| Spacing: space-between | justify: space-between |

## Cuando no hay equivalente
Mapear al widget atómico más cercano y **anotar la aproximación** en el reporte de
fidelidad. Nunca abortar la sección por un elemento sin equivalente exacto.
````

- [ ] **Step 2: Criterio de aceptación**

Revisar que cada fila de la tabla de mapeo del spec está presente, más las
equivalencias de alineación. Sin TODO/TBD.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/figma-to-elementor/references/mapping-table.md
git commit -m "docs: add Figma to Elementor v4 mapping table"
```

---

### Task 3: Documentar el loop de verificación

**Files:**
- Create: `.claude/skills/figma-to-elementor/references/verification-loop.md`

- [ ] **Step 1: Escribir el procedimiento del loop**

Contenido del archivo:

````markdown
# Loop de verificación visual (por sección)

Se ejecuta justo después de construir cada sección.

## Procedimiento
1. **Render:** navegar el sitio en vivo a la página destino (navegador headless).
2. **Capturar:** screenshot de la sección recién construida.
3. **Comparar:** Figma screenshot vs Elementor render, lado a lado.
4. **Diagnosticar:** clasificar discrepancias en:
   - Espaciado (padding/gap)   - Color (token mal mapeado)
   - Tipografía (tamaño/peso)  - Alineación / dirección flex
   - Texto (contenido/salto)   - Asset (imagen/escala/fit)
5. **Corregir:** `update-element` / `batch-update` / `update-atomic-widget`.
6. **Repetir** desde el paso 2 hasta "fiel" o tope de iteraciones.

## Reglas de parada
- **Tope: 3 iteraciones por sección.** Tras 3 vueltas, diferencias menores se
  registran como deuda (no bloquean).
- **Umbral "fiel":** discrepancias estructurales (layout, color, texto, fuente) se
  corrigen siempre; diferencias sub-píxel de espaciado son aceptables.

## Manejo de errores
- Asset que no descarga/sube → placeholder + anotar, no abortar.
- Elemento sin widget equivalente → mapear al más cercano + anotar.
- Llamada de Elementor falla → reintentar esa llamada sola (el troceo evita perder la
  sección entera).

## Estado por sección (para el reporte)
- `✅ fiel`
- `⚠️ fiel con deuda menor` + lista de diferencias residuales
- `❌ requiere intervención manual` + motivo
````

- [ ] **Step 2: Criterio de aceptación**

Revisar que incluye los 6 pasos del loop, el tope de 3 iteraciones, el umbral "fiel",
el manejo de errores y los 3 estados de reporte del spec.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/figma-to-elementor/references/verification-loop.md
git commit -m "docs: add verification loop reference"
```

---

### Task 4: Escribir el SKILL.md — frontmatter y orquestación general

**Files:**
- Create: `.claude/skills/figma-to-elementor/SKILL.md`

- [ ] **Step 1: Escribir frontmatter + visión general + secuencia de unidades**

Contenido inicial del archivo:

````markdown
---
name: figma-to-elementor
description: Use when reconstructing a Figma page/design into Elementor v4 (atomic/flexbox) with faithful + responsive fidelity. Bridges Figma MCP and Elementor MCP via an intermediate section-plan (IR) and a visual verification loop.
---

# Figma → Elementor

Reconstruye páginas completas de Figma en Elementor v4 con fidelidad "fiel + responsive".
Claude es el traductor entre los dos MCP: lee Figma (screenshot + metadata + variables +
assets), produce un Plan de Sección (IR), y lo ejecuta como llamadas atómicas de Elementor.
Trabaja **sección por sección, de arriba a abajo**, verificando cada una contra el sitio
en vivo antes de pasar a la siguiente.

## Entrada
- Link o nodo de Figma de la página a reconstruir.
- Página destino de Elementor (id existente o crear nueva con `create-page`).
- URL del sitio en vivo donde se renderiza la página destino (para verificación).

## Referencias (leer antes de empezar)
- `references/ir-schema.md` — esquema del Plan de Sección.
- `references/mapping-table.md` — mapeo Figma → Elementor v4.
- `references/verification-loop.md` — loop de verificación y reglas de parada.

## Secuencia
1. **Unidad 0** — Setup de tokens globales (una vez).
2. **Unidad 1** — Trocear la página en secciones ordenadas.
3. Por cada sección, de arriba a abajo:
   - **Unidad 2** — Extraer → llenar el IR.
   - **Unidad 3** — Construir en Elementor desde el IR.
   - **Unidad 4** — Verificar contra el sitio en vivo (loop, tope 3).
4. **Cierre** — Ensamblaje, verificación full-page, chequeo responsive, reporte.

## Reglas de oro
- Nunca volcar `get_design_context` de la página completa a Elementor. Trocear siempre.
- El screenshot manda para layout; metadata/variables para valores exactos.
- Usar tokens globales, nunca colores/tipografías hardcodeadas.
- Preferir `batch-update` para minimizar llamadas.
````

- [ ] **Step 2: Criterio de aceptación**

Run: `ls .claude/skills/figma-to-elementor/SKILL.md`
Verificar que el frontmatter tiene `name` y `description`, que la descripción dispara
con intención "reconstruir Figma en Elementor", y que lista las 3 referencias y las 4
fases. La skill debería aparecer en el listado de skills tras recargar.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/figma-to-elementor/SKILL.md
git commit -m "feat: add figma-to-elementor skill orchestrator skeleton"
```

---

### Task 5: SKILL.md — Unidad 0 (tokens) y Unidad 1 (troceo)

**Files:**
- Modify: `.claude/skills/figma-to-elementor/SKILL.md` (append)

- [ ] **Step 1: Añadir las secciones de Unidad 0 y Unidad 1**

Append al SKILL.md:

````markdown
## Unidad 0 · Setup de tokens globales (una vez por proyecto)

1. `detect-elementor-version` para confirmar editor v4 (atómico). Si no es v4, avisar.
2. Figma: `get_variable_defs` de la página → recolectar colores y tipografías.
3. Mapear cada variable a un token global:
   - Colores → `update-global-colors`.
   - Tipografías → `update-global-typography`.
4. Guardar la tabla `nombre-token-figma → nombre-token-elementor` para usarla al llenar
   el IR. A partir de aquí, todo `token.color`/`token.typography` del IR usa estos nombres.

**Salida:** tokens globales creados + tabla de mapeo de nombres.

## Unidad 1 · Trocear la página en secciones

1. Figma: `get_metadata` de la página → los nodos top-level son las secciones.
2. Figma: `get_screenshot` de la página completa → confirmar orden visual y nombres.
3. Producir la **lista ordenada de secciones**: `[{name, figmaNodeId}]` de arriba a abajo.
4. Si la página destino no existe, `create-page`. Anotar su id y la URL en vivo.

**Salida:** lista ordenada de secciones + página destino lista.
````

- [ ] **Step 2: Criterio de aceptación**

Revisar que Unidad 0 nombra `detect-elementor-version`, `get_variable_defs`,
`update-global-colors`, `update-global-typography`; y Unidad 1 nombra `get_metadata`,
`get_screenshot`, `create-page`. Ambas declaran su "Salida".

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/figma-to-elementor/SKILL.md
git commit -m "feat: add token setup and page chunking units to skill"
```

---

### Task 6: SKILL.md — Unidad 2 (extractor de sección)

**Files:**
- Modify: `.claude/skills/figma-to-elementor/SKILL.md` (append)

- [ ] **Step 1: Añadir la Unidad 2**

Append al SKILL.md:

````markdown
## Unidad 2 · Extractor de sección (llena el IR)

Por cada sección de la lista, en orden:

1. `get_screenshot(figmaNodeId)` → referencia visual de la sección. **Esta manda para
   layout/jerarquía/proporción.**
2. `get_metadata(figmaNodeId)` → estructura: flex direction, gaps, padding, tamaños,
   jerarquía de hijos. → llena `layout` del IR.
3. `get_design_context(figmaNodeId)` ligero / `get_variable_defs` → textos exactos,
   color y tipografía por nodo. → llena `text` y `token` de cada child.
4. `download_assets(figmaNodeId)` → imágenes/SVG de la sección. Por cada asset:
   - imagen → `sideload-image` en Elementor → guardar URL/ID en `assetId`.
   - icono/vector → `upload-svg-icon` → guardar ID en `assetId`.
5. Construir el objeto **Plan de Sección (IR)** completo según `references/ir-schema.md`.
6. Validar el IR: todo `token.*` existe en la tabla de Unidad 0; todo `assetId` apunta a
   un asset subido. Si falta un asset, marcar placeholder y anotar.

**Salida:** un Plan de Sección (IR) validado para esta sección.
````

- [ ] **Step 2: Criterio de aceptación**

Revisar que la Unidad 2 nombra las 5 herramientas Figma del spec (`get_screenshot`,
`get_metadata`, `get_design_context`, `get_variable_defs`, `download_assets`) y las de
subida (`sideload-image`, `upload-svg-icon`), y que produce el IR validado.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/figma-to-elementor/SKILL.md
git commit -m "feat: add section extractor unit to skill"
```

---

### Task 7: SKILL.md — Unidad 3 (constructor Elementor)

**Files:**
- Modify: `.claude/skills/figma-to-elementor/SKILL.md` (append)

- [ ] **Step 1: Añadir la Unidad 3**

Append al SKILL.md:

````markdown
## Unidad 3 · Constructor Elementor (consume el IR)

Por cada Plan de Sección (IR):

1. Crear el contenedor raíz de la sección: `add-flexbox` con `direction`, `gap`,
   `padding`, `align`, `justify` del `layout` del IR.
2. Recorrer `children` en orden y, según `type`, usar el mapeo de
   `references/mapping-table.md`:
   - `heading` → `add-atomic-heading` (texto + token tipografía/color).
   - `paragraph` → `add-atomic-paragraph`.
   - `button` → `add-atomic-button` (texto + href + token color).
   - `image` → `add-atomic-image` (assetId + fit).
   - `svg` → `add-atomic-svg` (assetId).
   - `flexbox` (anidado) → `add-flexbox` y recursión sobre sus `children`.
3. Agrupar el máximo de operaciones en `batch-update` para minimizar llamadas.
4. Confirmar con `get-page-structure` que la sección quedó montada con la jerarquía
   esperada antes de verificar.

**Salida:** sección construida en la página destino.
````

- [ ] **Step 2: Criterio de aceptación**

Revisar que cada `type` del IR tiene su llamada Elementor correspondiente y coincide con
`mapping-table.md`; que menciona `batch-update` y `get-page-structure`. Verificar
consistencia de nombres: los `type` usados aquí (`heading`, `paragraph`, `button`,
`image`, `svg`, `flexbox`) son exactamente los definidos en `ir-schema.md`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/figma-to-elementor/SKILL.md
git commit -m "feat: add Elementor builder unit to skill"
```

---

### Task 8: SKILL.md — Unidad 4 (verificación) y cierre

**Files:**
- Modify: `.claude/skills/figma-to-elementor/SKILL.md` (append)

- [ ] **Step 1: Añadir Unidad 4 y el cierre**

Append al SKILL.md:

````markdown
## Unidad 4 · Verificación visual (por sección)

Seguir `references/verification-loop.md`:
1. Navegar el sitio en vivo a la página destino (navegador headless).
2. Screenshot de la sección construida.
3. Comparar contra el screenshot de Figma de la Unidad 2.
4. Diagnosticar discrepancias (espaciado, color, tipografía, alineación, texto, asset).
5. Corregir con `update-element` / `batch-update` / `update-atomic-widget`.
6. Repetir desde el paso 2. **Tope: 3 iteraciones.** Diferencias menores residuales →
   registrar como deuda.

Asignar estado a la sección: `✅ fiel` / `⚠️ fiel con deuda menor` / `❌ manual`.

## Cierre · Ensamblaje, responsive y reporte

1. Cuando todas las secciones estén `✅`/`⚠️`, render full-page y screenshot completo.
2. Comparar página completa vs Figma completo (orden y espaciado entre secciones).
3. **Responsive:** `resize` del navegador a tablet y móvil; verificar que el flex
   aguanta. Ajustar breakpoints en Elementor si rompe.
4. Emitir **reporte de fidelidad**: una línea por sección con su estado + lista de deuda
   menor + cualquier `❌` con motivo.

**Salida:** página reconstruida + reporte de fidelidad.
````

- [ ] **Step 2: Criterio de aceptación**

Revisar que Unidad 4 referencia `verification-loop.md` y repite el tope de 3; que el
cierre incluye full-page, chequeo responsive (`resize` tablet/móvil) y el reporte con los
3 estados. Sin TODO/TBD en todo el SKILL.md.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/figma-to-elementor/SKILL.md
git commit -m "feat: add verification unit and closing report to skill"
```

---

### Task 9: Revisión de coherencia de la skill completa

**Files:**
- Modify: cualquiera de los 4 archivos si hay inconsistencias.

- [ ] **Step 1: Leer los 4 archivos juntos y verificar coherencia**

Run: `cat .claude/skills/figma-to-elementor/SKILL.md .claude/skills/figma-to-elementor/references/*.md`

Verificar:
- Los `type` de child son idénticos en `ir-schema.md`, la tabla de mapeo y la Unidad 3.
- Los nombres de herramientas MCP son los reales (cotejar con el spec).
- El tope de iteraciones (3) es consistente en SKILL.md y `verification-loop.md`.
- No hay placeholders (TODO/TBD/"completar luego").

- [ ] **Step 2: Corregir inconsistencias encontradas inline**

(Editar el archivo que corresponda; sin código nuevo, solo coherencia.)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/figma-to-elementor
git commit -m "docs: fix cross-file consistency in figma-to-elementor skill"
```

---

### Task 10: Dry-run de validación sobre una página real (prueba integral)

Esta es la "prueba real" del flujo. Requiere un link de Figma real, una página de
Elementor destino y la URL en vivo.

**Files:**
- Create: `docs/superpowers/plans/2026-06-16-figma-to-elementor-dryrun-report.md`

- [ ] **Step 1: Invocar la skill sobre UNA sección primero**

Ejecutar `/figma-to-elementor` apuntando a una **sola sección** simple (ej. el hero) de
una página real, no la página completa. Pasar: nodo de Figma del hero, página destino
de Elementor, URL en vivo.

- [ ] **Step 2: Verificar que el flujo produce el IR y construye**

Confirmar que: (a) se generó el Plan de Sección (IR) válido, (b) Elementor montó la
sección, (c) el loop de verificación corrió y emitió un estado (`✅`/`⚠️`/`❌`).
Expected: la sección hero aparece en el sitio en vivo, visualmente cercana al Figma.

- [ ] **Step 3: Documentar resultado y fricciones**

Escribir en el reporte de dry-run: qué funcionó, dónde el mapeo falló, qué herramienta
MCP se comportó distinto a lo esperado, y ajustes necesarios a las referencias.

- [ ] **Step 4: Aplicar ajustes a la skill si el dry-run reveló problemas**

Editar SKILL.md o las referencias según lo aprendido. (Iterar Tarea 10 sobre la misma
sección hasta que quede `✅`/`⚠️`.)

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-06-16-figma-to-elementor-dryrun-report.md .claude/skills/figma-to-elementor
git commit -m "test: validate figma-to-elementor skill on real hero section"
```

---

## Notas de ejecución

- **Una sección real antes de la página completa.** La Tarea 10 prueba el hero primero;
  solo cuando un flujo de sección funciona bien se escala a la página entera.
- **Dependencia externa:** la Tarea 10 necesita credenciales/acceso reales (Figma file +
  sitio Elementor en vivo). Si no están disponibles al ejecutar, parar tras la Tarea 9 y
  marcar la Tarea 10 como bloqueada pendiente de acceso.
- **Fuera de alcance (no implementar):** pixel-perfect estricto, animaciones/prototipos
  de Figma, templates reutilizables de Elementor (fase 2), Code Connect.
