---
name: copy-to-wireframe
description: Convierte copy estructurado por secciones (title/meta/H1 + secciones) en un wireframe HTML lo-fi navegable, una página por frame, listo para capturar a Figma. Úsala tras el copy SEO y antes de la captura html-to-figma.
---

# copy-to-wireframe

Transforma el copy de una web de servicios en **wireframes lo-fi** (gris, sin branding) con
bloques reales: hero, zigzag texto/imagen, grids de tarjetas, mapa, CTA, formulario, footer.
No es diseño hi-fi: es estructura + jerarquía + placeholders, para validar el esqueleto y luego
capturarlo a Figma.

## Cuándo usarla
- Tienes copy por secciones (de keyword research + redacción) y quieres ver el esqueleto.
- Es el paso ③ del pipeline: `[copy] → [copy-to-wireframe] → [html-to-figma-capture] → [figma-to-elementor]`.

## Entrada
JSON con esta forma (lo produce el paso ② Copy):
```json
{ "pages": [ { "page": "Inicio", "title": "...", "meta": "...", "h1": "...",
  "sections": [ { "name": "Hero", "heading": "...", "body": "...", "keywords": ["..."] } ] } ] }
```

## Salida
Un **único documento HTML autocontenido**. Una `<section class="pagewrap" id="p-<slug>">` por
página, cada una con un `<div class="frame">` que contiene los bloques. Usa **exclusivamente** las
clases de `references/component-library.md` (no inventes CSS). El id `p-<slug>` y el selector
`.frame` son los que usa la captura a Figma — no los cambies.

## Cómo
1. Lee `references/component-library.md` (CSS + catálogo de bloques + reglas sección→layout).
2. Por cada sección, elige el bloque según su `name`/intención (hero, grid, mapa, CTA, zigzag…).
3. Añade `nav` arriba y `footer` abajo en cada página. Todo imagen/mapa = un `.ph`.
4. Devuelve SOLO el HTML.

## Reglas
- **Lo-fi**: gris, sin colores de marca, sin fuentes custom. Es un wireframe, no un diseño.
- Toda imagen/foto/mapa = un `.ph` con etiqueta corta ("Imagen", "Mapa", "Galería").
- Un único H1 por página (la primera sección, el hero).
- No inventes datos; respeta los placeholders del copy (`[horario]`, `[dirección]`…).
- El slug del id se genera del nombre de página en minúsculas, sin acentos, no-alfanumérico→`-`.
