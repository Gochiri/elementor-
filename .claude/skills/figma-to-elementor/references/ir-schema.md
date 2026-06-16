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
