# Etapa previa del flujo web: wireframes con copy + captura HTML → Figma

**Validado 2026-06-24 (caso Ágave Azul).** Esta referencia cubre el tramo **anterior** a
`figma-to-elementor`: cómo Claude genera la página/los wireframes en HTML y los **empuja a
Figma** con `generate_figma_design` (MCP de Figma), para que el diseñador apruebe/edite
antes de reconstruir en Elementor.

```
Briefing → keyword research + copy SEO (SE Ranking)
   → ① WIREFRAMES: 4-5 variantes HTML lo-fi (gris) CON el copy+SEO ya colocado
   → ② captura HTML→Figma (frames editables) → cliente aprueba/edita estructura
   → ③ hi-fi sobre la variante aprobada → ④ figma-to-elementor (este skill) → Elementor
```

## 1. Wireframes con copy (reemplazo de Relume)

Relume entregaba **wireframe + copy** para aprobar. Replicarlo con Claude, **mejor**: el
copy y el SEO van colocados desde el wireframe (no se pierde info por el corte de 5.000
caracteres de Relume).

- Generar **4-5 variantes** de estructura (clásica, editorial, visual, conversión,
  storytelling…), cada una un HTML **lo-fi en gris** (cajas, `dashed` para imágenes), con
  **H1/H2 + el copy real** de la etapa anterior en cada sección (no Lorem Ipsum, no barras).
- Es un **wireframe de aprobación**: decide *layout y orden*, no color/tipografía (eso llega
  en el hi-fi). Servir un board comparativo + capturar cada variante a Figma como frame
  editable para que el equipo elija/retoque ahí.
- Solo cuando hay una variante aprobada se construye el **HTML hi-fi** de esa estructura, y
  de ahí a Figma → este skill.

## 2. Receta de captura HTML → Figma (LOCAL)

`generate_figma_design` captura una **página renderizada** (no acepta HTML inline ni
`file://`): hay que servir el HTML por HTTP y abrirlo con los parámetros de captura en el
hash. El MCP de Figma debe estar autenticado (`whoami`).

1. **Servir** la carpeta del mockup: `python -m http.server 8765` (o `npx http-server`).
2. **Archivo Figma destino**: `create_new_file` (cargar antes el skill `figma-create-new-file`;
   usar el `planKey` de `whoami`). Reutilizar el `fileKey` para todas las capturas.
3. **Script de captura en el HTML** (una vez): en `<head>`
   ```html
   <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
   ```
4. **Por cada captura** (página completa o un elemento por selector):
   1. `generate_figma_design(fileKey)` → devuelve un `captureId` (único, de un solo uso).
   2. **Reset duro del navegador a `about:blank`** (ver gotcha) — vía Playwright MCP.
   3. Navegar a `http://localhost:8765/…#figmacapture=<id>&figmaendpoint=<endpoint-urlencoded>&figmadelay=1500[&figmaselector=<css-urlencoded>]`.
   4. **Poll**: `generate_figma_design(fileKey, captureId)` hasta `completed` (devuelve el
      `node-id` del frame creado).
5. **Verificar**: `get_screenshot(fileKey, nodeId)` del frame creado.
6. **Borrar/rehacer** frames con `use_figma` (`getNodeByIdAsync(id).remove()`); el board o
   las variantes viejas se limpian así.

`figmaselector` permite capturar **un elemento** (p. ej. `#v2 .frame`) en vez de `body` →
útil para meter cada variante de wireframe como su propio frame. URL-encode el selector
(`#v2 .frame` → `%23v2%20.frame`).

## 3. Gotchas (los que costaron tiempo)

- **⚠️ Navegar cambiando SOLO el `#hash` NO recarga la página**, así que `capture.js` no se
  re-dispara y la captura **se queda colgada en `pending` para siempre**. **Fix
  obligatorio:** antes de cada captura, navegar a **`about:blank`** y luego a la URL con
  hash → fuerza recarga fresca y la captura completa al primer poll. (Síntoma del bug: 2-3
  min en `pending` sin avanzar.)
- **⚠️ Qué navegador usar para el reset (validado 2026-06-25, sitio Ágave Azul):** el tool
  `claude-in-chrome navigate` **rechaza `about:blank`** ("Can't interact with browser-internal
  URLs") y, peor, **solo la PRIMERA captura del tab funciona**; las siguientes se quedan en
  `pending` para siempre aunque navegues a una URL `http` neutra o abras tab nueva. Reset con
  URL http neutra ≠ reset a `about:blank`. **Fix que funciona:** hacer las capturas con el
  **Playwright MCP standalone (`plugin_playwright_playwright`, navegador propio)** —
  `about:blank` → URL con hash → `wait 4s` → poll. **No** usar el Playwright de
  extensión-bridge (`plugin_ecc_playwright`): da "Extension connection timeout". Con el
  standalone, 1 captura por página entró limpia a la primera (7/7 páginas).
- **No uses `browser_evaluate` con `fetch()` a `mcp.figma.com` desde la página**: el `fetch`
  cross-origin **cuelga** el evaluate (parece que "se queda pensando"). Usa la vía del
  **script tag + hash URL**, no la inyección por evaluate.
- **`pending` es normal unos 10-30 s** (cola de Figma). Si pasa de ~1 min, casi siempre es
  el gotcha del hash → resetear y recapturar, no seguir poleando.
- **Capturas en paralelo**: con el archivo ya creado puedes generar varios `captureId` de
  golpe, pero **el navegador es uno**: hazlas en serie (`about:blank` → navegar → poll) por
  variante. El warning de "loop" al generar/polear varias IDs iguales es **falso positivo**.
- **El resultado entra como frames "en crudo"** (no componentes del sistema de diseño). Es
  lo correcto para la etapa de wireframe/aprobación: el diseñador aplica tokens en el hi-fi.
- **Limpieza**: dejar `capture.js` en el HTML habilita la barra de re-captura de Figma
  (Figma recomienda no quitarla salvo que se pida). Parar el server local al terminar.

## 4. Relación con este skill

Este tramo produce el **archivo Figma** que `figma-to-elementor` consume después (su
"Entrada"). El skill empieza cuando ya hay una página hi-fi aprobada en Figma; esta
referencia documenta cómo se llegó hasta ahí desde el copy.
