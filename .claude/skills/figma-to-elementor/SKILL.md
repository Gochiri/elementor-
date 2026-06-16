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
- `references/figma-heuristics.md` — heurísticas de mapeo (peso de fuente, tamaño→heading,
  alineación, fills, y reagrupado semántico de frames sin auto-layout).
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

## Estilado de widgets atómicos — método validado (dry-run 2026-06-16)
- **NO usar `update-atomic-widget` para estilo visual** (`color`, `background-color`,
  `border-*`): devuelve `success:true` pero NO persiste ni renderiza (el estilo atómico
  vive en `styles`/`variants` referenciado por `classes`, no en `settings`). Las clases
  globales NO son creables por el MCP (`list-global-classes` es read-only).
- **Método que SÍ renderiza — inyección de CSS de página:** usar `update-page-settings`
  con `custom_css` scopeado al page-id. **Selector correcto: `[data-id="{ELEMENT_ID}"]`**
  (los widgets atómicos NO usan `.elementor-element-{id}`; usan clases `e-heading-base`/
  `e-button-base` + atributo `data-id`). Con `!important`:
  ```css
  body.page-id-{POST_ID} [data-id="{HEADING_ID}"] { color:#002fa7 !important; font-size:70px !important; }
  /* botón: el <a class="e-button-base"> ES el elemento data-id; apuntar directo + descendientes */
  body.page-id-{POST_ID} [data-id="{BTN_ID}"], body.page-id-{POST_ID} [data-id="{BTN_ID}"] * { background-color:#002fa7 !important; color:#fff !important; }
  ```
  Validado end-to-end sobre el hero de omibu: títulos (oscuro/azul 70px bold) y botones
  (filled azul-blanco / outline) renderizaron fieles al Figma.
- Layout (`add-flexbox`: direction/gap/padding/align/background_color) y contenido
  (texto, tag) SÍ se escriben directo. Solo el estilo tipográfico/color/borde per-widget
  necesita la inyección de CSS.
- Verificar siempre con `get-element-settings` + screenshot; nunca confiar en `success:true`.
  Ver `docs/superpowers/plans/2026-06-16-figma-to-elementor-dryrun-report.md`.
- **Unidad 0 debe ser no-destructiva:** solo añadir tokens globales que no existan; nunca
  sobrescribir el kit de un sitio con kit propio sin aprobación.
- `success:true` del MCP NO garantiza efecto — la verificación no debe confiar en él.
- `gap: 0` es inválido en `add-flexbox` (omitir el gap).
- Borrador no es visible públicamente: publicar la página (o usar sesión autenticada)
  antes de verificar con navegador headless.

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
4. **Estilo visual** (color de texto, color/borde de botón, tipografía): NO con
   `update-atomic-widget` (no renderiza). Acumular reglas CSS por elemento y aplicarlas
   en un solo `update-page-settings` con `custom_css` (ver "Estilado de widgets atómicos").
   El layout y `background_color` de flexbox sí van directos en `add-flexbox`.
5. Confirmar con `get-page-structure` que la sección quedó montada con la jerarquía
   esperada antes de verificar.

**Salida:** sección construida y estilada en la página destino.

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
