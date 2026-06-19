# Dry-run Report — Figma → Elementor (Tarea 10)

**Fecha:** 2026-06-16
**Sección probada:** bloque de texto del hero de omibu (Figma node `17:239`)
**Página destino:** WordPress/Elementor `post_id=220` en `TU-WORDPRESS`
**URL en vivo:** https://TU-WORDPRESS/dry-run-hero-figma-to-elementor/
**Estado global:** ✅ Pipeline validado / estilo visual resuelto vía inyección de CSS

---

## Qué se validó (✅ funciona)

1. **Conexión de ambos MCP:** Figma (cuenta ómibu) y Elementor (4.1.1, atómico) operativos.
2. **Extracción Figma (Unidades 1–2):** `get_metadata` + `get_screenshot` +
   `get_design_context` + `get_variable_defs` entregaron estructura, textos exactos,
   colores (`#0c0d18`, `#002fa7`) y tipografía (Neue Haas Grotesk Display Pro).
3. **Contrato intermedio (IR):** se generó el Plan de Sección y se construyó 1:1.
4. **Construcción estructural (Unidad 3):** `add-flexbox` (anidado) + `add-atomic-heading`
   + `add-atomic-button` produjeron el árbol EXACTO esperado:
   ```
   e-flexbox (column, gap 50, padding 80)
   ├─ e-flexbox (column)        ← grupo de títulos
   │  ├─ e-heading "Todo es para"
   │  └─ e-heading "llegar a tus clientes"
   └─ e-flexbox (row, gap 14)   ← fila de botones
      ├─ e-button "Contáctanos"
      └─ e-button "Nuestros servicios"
   ```
5. **Texto y jerarquía:** 100% correctos.
6. **Verificación (Unidad 4):** render del sitio en vivo + screenshot + comparación
   contra Figma funcionó (vía playwright estándar tras publicar la página).

## Qué falló (❌ y por qué)

**Hallazgo raíz — el estilo visual de widgets atómicos no es escribible por el MCP.**

- `update-atomic-widget` con `{color, background-color, border-*}` en formato
  `$$type` devuelve `success:true` **pero no persiste ni renderiza**.
- `get-element-settings` confirmó que el elemento solo guardó `classes`, `tag`, `title`;
  los props de estilo **se descartaron en silencio**.
- Causa: en Elementor v4 atómico el estilo vive en un array `styles`/`variants`
  referenciado por `classes`, **no** en `settings`. El tool solo hace merge en `settings`.
- Consecuencia visual: el título azul renderiza oscuro; ambos botones renderizan con el
  estilo por defecto del tema (fondo azul, texto rojizo) en vez de filled-blanco /
  outline.

**Frictions secundarias detectadas:**

1. **Unidad 0 destructiva:** el sitio ya tiene un kit global (colores por defecto de
   Elementor). Sobrescribir tokens globales afectaría todo el sitio. En el dry-run se
   evitó usando hex directos.
2. **`add-atomic-*` no acepta estilos inline:** obliga a un segundo paso de estilo
   (que además está bloqueado, ver hallazgo raíz).
3. **`get-widget-schema` devuelve el schema legacy**, no el atómico → no documenta el
   formato `$$type` ni la ruta de `styles`. Se descubrió el formato por prueba/error.
4. **`gap: 0` es inválido** en `add-flexbox` (usar omitir gap).
5. **`success:true` no garantiza efecto** → la verificación NO debe confiar en el código
   de retorno; debe releer con `get-element-settings` y/o screenshot.
6. **Borrador no es visible públicamente** → para verificar hay que publicar (o usar
   sesión autenticada). En el dry-run se publicó la página de prueba.

## Por qué esto explica "los screenshots funcionan mejor"

Cuando el estilo per-widget no se puede fijar de forma fiable vía datos estructurados,
el agente cae en aproximación visual desde screenshot — que es justo lo que el usuario
observó. El problema no era el prompt: era una **capacidad faltante del MCP de Elementor**.

## Ajustes aplicados a la skill

1. **Unidad 3 (mapping-table / SKILL):** advertir que el estilo visual de widgets
   atómicos (color/fondo/borde de texto y botones) **no es escribible** con el toolset
   actual; preferir estilo a nivel `flexbox` (`background_color` sí funciona como param),
   clases globales, o marcar como deuda.
2. **Unidad 0:** hacerla **no-destructiva** — solo añadir tokens que no existan; nunca
   sobrescribir el kit de un sitio con kit propio sin aprobación.
3. **Unidad 4 (verification-loop):** NO confiar en `success:true`; verificar persistencia
   con `get-element-settings` además del screenshot.

## Solución validada (inyección de CSS)

Se investigó el workaround y **quedó resuelto**:

- Las **clases globales NO son creables** por el MCP (`list-global-classes` es read-only;
  el sitio tiene 0 clases).
- La página de producción de omibu (post 52) usa widgets **legacy** + un widget `html`
  con un `<style>` scopeado a `body.page-id-52` y `!important` — es decir, **inyección de
  CSS**, no props de estilo.
- **Probado y confirmado:** aplicar `update-page-settings` con `custom_css`. El selector
  correcto para widgets atómicos es **`[data-id="{ELEMENT_ID}"]`** (no
  `.elementor-element-{id}`; usan `e-heading-base`/`e-button-base` + `data-id`):
  ```css
  body.page-id-245 [data-id="bede655"] { color:#002fa7 !important; font-size:70px !important; }
  ```
  Validado end-to-end sobre el hero completo de omibu (post 245): títulos oscuro/azul y
  botones filled/outline renderizaron **fieles al Figma**. ✅
- **Unidad 3 actualizada:** el estilo visual per-widget se acumula y se aplica en un solo
  `update-page-settings` con `custom_css` (scope `body.page-id-{id} .elementor-element-{id}`),
  no con `update-atomic-widget`.

## Nota operativa

Las páginas de prueba (`post_id=220` y `post_id=238`) se movieron a la **papelera**.

