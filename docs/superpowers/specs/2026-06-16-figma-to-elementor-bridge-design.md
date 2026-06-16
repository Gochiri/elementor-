# Puente Figma → Elementor (MCP a MCP)

**Fecha:** 2026-06-16
**Estado:** Diseño aprobado, pendiente de plan de implementación

---

## Problema

Se necesita un flujo **reutilizable** para llevar diseños de Figma (vía Figma MCP) y
reconstruirlos **fielmente** en Elementor (vía Elementor MCP). El cuello de botella
actual es la **comunicación entre los dos MCP**: tratarlo como un tubo directo
(volcar `get_design_context` de Figma y pasárselo a Elementor para que "lo construya")
falla porque:

1. Figma exporta **posición absoluta**; Elementor v4 piensa en **flexbox**. No mapean.
2. El volcado de diseño es enorme → satura el contexto y el MCP de Elementor se pierde.
3. Elementor necesita **llamadas concretas** (`add-flexbox`, `add-atomic-heading`…)
   con su schema, no un blob de código.

Observación de campo confirmada: el MCP de Elementor se comporta mejor con
**capturas de pantalla** (intención visual) que con datos estructurados crudos.

## Objetivo y alcance

- **Entregable:** flujo reutilizable (skill + docs de referencia), no un one-off.
- **Fidelidad:** **fiel + responsive** — visualmente igual al ojo (layout, jerarquía,
  colores, espaciados, tipografía correctos), priorizando responsive y mantenibilidad.
  NO pixel-perfect estricto.
- **Input típico:** páginas completas (se trocean en secciones).
- **Target Elementor:** widgets **atómicos / v4** (div-block, flexbox) → mapeo casi 1:1
  con el auto-layout de Figma.
- **Verificación:** hay un **sitio en vivo accesible** donde renderizar el resultado y
  compararlo contra Figma para iterar.

## Decisión de enfoque

Enfoque elegido: **Híbrido "screenshot-first + extractos de precisión", con Claude
como traductor.**

- El screenshot manda para el **layout/intención**.
- `metadata` + `variables` aportan **valores exactos** (tokens, texto, padding).
- `download_assets` trae imágenes/iconos.
- Loop de verificación contra el sitio en vivo cierra la brecha de fidelidad.

Descartados:
- **Transcodificación estructurada (tubo directo):** es justo lo que falla — satura,
  frágil, la posición absoluta no cae en flex.
- **Solo-screenshot:** adivina colores/fuentes/textos exactos → no llega a "fiel".

## Arquitectura: el contrato intermedio (IR)

Los dos MCP **no se hablan directamente**. En medio va un **Plan de Sección (IR en
JSON)** que Claude produce leyendo Figma y consume para manejar Elementor. Cada lado
habla con el contrato, no con el otro MCP. Si mañana cambia un MCP, solo se toca un
lado del contrato.

```
   FIGMA MCP                    CLAUDE (traductor)                  ELEMENTOR MCP
 ┌───────────┐      extrae    ┌──────────────────┐    ejecuta    ┌───────────────┐
 │ screenshot├───────────────▶│  PLAN DE SECCIÓN │───────────────▶│ add-flexbox   │
 │ metadata  │   (intención   │  (IR en JSON)    │  (llamadas    │ add-atomic-*  │
 │ variables │    +precisión) │                  │   concretas)  │ batch-update  │
 │ assets    │                └──────────────────┘                └───────────────┘
 └───────────┘                         ▲                                   │
                                       │         render + screenshot       ▼
                                       └────────── LOOP VERIFICACIÓN ◀── sitio en vivo
```

### Esquema del Plan de Sección (IR)

```json
{
  "section": "hero",
  "figmaNodeId": "12:345",
  "layout": {
    "type": "flexbox",
    "direction": "column",
    "gap": 24,
    "padding": [80, 40, 80, 40],
    "align": "center",
    "justify": "center"
  },
  "children": [
    { "type": "heading",   "text": "Tu título",  "token": {"typography": "h1",   "color": "primary"} },
    { "type": "paragraph", "text": "Subtítulo…",  "token": {"typography": "body", "color": "neutral-700"} },
    { "type": "button",    "text": "Empezar",     "token": {"color": "primary"}, "href": "#" },
    { "type": "image",     "assetId": "hero-img", "fit": "cover" }
  ]
}
```

## Flujo: las 5 unidades

Cada unidad tiene propósito único, entrada/salida claras y es testeable por separado.
El flujo procesa **sección por sección, de arriba a abajo**: extraer → construir →
verificar → corregir → siguiente. Nunca toda la página de golpe.

### Unidad 0 · Setup de tokens globales (una vez por proyecto)
- Figma: `get_variable_defs` → colores y tipografías del design system.
- Elementor: `update-global-colors` + `update-global-typography`.
- Resultado: todo widget referencia tokens globales → consistencia, responsive y un
  solo punto de cambio. Evita hardcodear colores por elemento.

### Unidad 1 · Troceo de la página → secciones
- Figma: `get_metadata` de la página → nodos top-level = secciones.
- Figma: `get_screenshot` de la página completa → orden y mapa mental.
- Resultado: lista ordenada de secciones (el índice de la página).

### Unidad 2 · Extractor de sección (llena el IR)
- `get_screenshot(sección)` → referencia visual.
- `get_metadata(sección)` → flex direction, gaps, padding, tamaños, jerarquía.
- `get_design_context(sección)` ligero / `get_variable_defs` → textos exactos,
  colores y tipografías por nodo.
- `download_assets(sección)` → imágenes/SVG → `sideload-image` / `upload-svg-icon`
  en Elementor → URLs/IDs.
- Resultado: el Plan de Sección (IR) completo y validado.

### Unidad 3 · Constructor Elementor (consume el IR)
- Traduce auto-layout → flexbox (ver tabla de mapeo).
- Ejecuta con `batch-update` siempre que se pueda (menos llamadas = menos riesgo de
  que el MCP se pierda).
- Resultado: la sección construida en la página.

### Unidad 4 · Verificación visual (por sección)
Ver sección siguiente.

## Loop de verificación

Se ejecuta por sección, justo después de construirla.

```
1. Render      → navegar el sitio en vivo (navegador headless)
2. Capturar    → screenshot de la sección construida
3. Comparar    → Figma screenshot  vs  Elementor render, lado a lado
4. Diagnosticar→ discrepancias clasificadas:
      • Espaciado (padding/gap)   • Color (token mal mapeado)
      • Tipografía (tamaño/peso)  • Alineación / dirección flex
      • Texto (contenido/salto)   • Asset (imagen/escala/fit)
5. Corregir    → update-element / batch-update / update-atomic-widget
6. Repetir desde 2  hasta  "fiel"  o  límite de iteraciones
```

### Reglas de parada (evitar loop eterno)
- **Tope: 3 iteraciones por sección.** Diferencias menores tras 3 vueltas → se
  registran como deuda, no bloquean.
- **Umbral "fiel":** discrepancias estructurales (layout, color, texto, fuente) se
  corrigen siempre; diferencias sub-píxel de espaciado son aceptables.
- Criterio de parada explícito para no ajustar 1px infinitamente.

### Manejo de errores
- Asset que no descarga/sube → placeholder + anotar, no abortar.
- Elemento de Figma sin widget atómico equivalente → mapear al más cercano + anotar.
- Llamada de Elementor falla → reintentar esa llamada sola (el troceo evita perder la
  sección entera).
- Responsive → al cerrar cada página, `resize` a móvil/tablet y verificar el flex;
  ajustar breakpoints en Elementor si rompe.

### Registro
Cada sección deja estado: `✅ fiel` · `⚠️ fiel con deuda menor (lista)` ·
`❌ requiere intervención manual (motivo)`. Reporte final por página.

## Tabla de mapeo Figma → Elementor v4

| Figma                          | Elementor atómico                      |
|--------------------------------|----------------------------------------|
| Frame auto-layout vertical     | `add-flexbox` direction=column         |
| Frame auto-layout horizontal   | `add-flexbox` direction=row            |
| Texto (heading)                | `add-atomic-heading`                   |
| Texto (cuerpo)                 | `add-atomic-paragraph`                 |
| Rectángulo con fill imagen     | `add-atomic-image` + `sideload-image`  |
| Vector / icono                 | `add-atomic-svg` + `upload-svg-icon`   |
| Botón / frame clicable         | `add-atomic-button`                    |
| Gap / padding del auto-layout  | gap / padding del flexbox              |
| Variable de color/tipografía   | token global de Elementor              |

## Empaquetado (reutilizable)

1. **Skill `/figma-to-elementor`** (en `.claude/skills/`): orquestador. Recibe
   link/nodo de Figma + página destino de Elementor; ejecuta las 5 unidades con los
   topes de iteración y el criterio de parada escritos como instrucciones.
2. **Doc de referencia:** la tabla de mapeo Figma → Elementor v4 (arriba).
3. **Esquema del IR (Plan de Sección):** contrato JSON documentado con sus campos,
   para que extractor y constructor siempre coincidan.

### Uso
```
/figma-to-elementor  <link-figma-de-la-página>  →  <página-elementor-destino>
```
El flujo trocea, construye y verifica sección por sección, y entrega la página + un
reporte de fidelidad.

## Fuera de alcance (YAGNI)

- Pixel-perfect estricto.
- Animaciones/interacciones complejas de Figma (prototipos).
- Generación de componentes/templates reutilizables de Elementor (posible fase 2).
- Code Connect (mapeo bidireccional código ↔ Figma).

## Herramientas MCP usadas

**Figma:** `get_variable_defs`, `get_metadata`, `get_screenshot`,
`get_design_context`, `download_assets`.

**Elementor:** `detect-elementor-version`, `update-global-colors`,
`update-global-typography`, `add-flexbox`, `add-div-block`, `add-atomic-heading`,
`add-atomic-paragraph`, `add-atomic-button`, `add-atomic-image`, `add-atomic-svg`,
`batch-update`, `update-element`, `update-atomic-widget`, `get-page-structure`,
`sideload-image`, `upload-svg-icon`.

**Verificación:** navegador headless (Playwright) contra el sitio en vivo.
