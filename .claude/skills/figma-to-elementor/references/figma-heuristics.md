# Heurísticas de mapeo Figma → Elementor

Destiladas del repo de referencia `ChooChye/figma-to-elementor` (plugin TS). Aplican a la
Unidad 2 (extracción → IR) y Unidad 3 (construcción), independientemente del paradigma.

## 1. Peso de fuente: nombre de estilo Figma → numérico

| Estilo Figma | weight |
|---|---|
| Thin | 100 |
| ExtraLight / Extra Light | 200 |
| Light | 300 |
| Regular | 400 |
| Medium | 500 |
| SemiBold / Semi Bold / DemiBold | 600 |
| Bold | 700 |
| ExtraBold / Extra Bold | 800 |
| Black / Heavy | 900 |

Quitar sufijo `Italic` antes de mapear. Default 400.

## 2. Tamaño de fuente → nivel de heading

| font-size (px) | tag |
|---|---|
| ≥ 56 | h1 |
| ≥ 42 | h2 |
| ≥ 32 | h3 |
| ≥ 24 | h4 |
| ≥ 20 | h5 |
| < 20 | h6 |

(Ajustar al contexto: el nodo más grande de la sección suele ser h1 aunque no llegue a 56.)

## 3. Unidades de line-height / letter-spacing

- Figma `PIXELS` → `px` (redondear).
- Figma `PERCENT` → `em` (valor/100, 2 decimales). Ej. 120% → 1.2em.
- line-height por defecto: 1.4em.

## 4. Alineación auto-layout → flexbox

| Figma (primary/counter axis) | flex |
|---|---|
| MIN | flex-start |
| CENTER | center |
| MAX | flex-end |
| SPACE_BETWEEN | space-between (solo primary) |
| STRETCH | stretch (solo counter) |

## 5. Extracción de fill (color/fondo)

- Tomar el **fill superior visible** (recorrer fills en reversa, saltar `visible:false`).
- `SOLID` → hex; si opacity < 1 → `rgba(...)`.
- `GRADIENT_LINEAR/RADIAL` → 2 paradas (primera y última) + ángulo
  `atan2(m[1][0], m[0][0]) · 180/π + 90` (Elementor solo soporta 2 stops → simplificar).
- `IMAGE` → exportar asset (en nuestro flujo: `download_assets` → `sideload-image`).

## 6. Sombra (drop shadow)

Tomar el primer `DROP_SHADOW` visible: `h=offset.x`, `v=offset.y`, `blur=radius`,
`spread`, `color=rgba`. Mapear a box-shadow del contenedor/botón.

## 7. ⭐ Grupos semánticos en frames SIN auto-layout (anti-patrón Figma)

En frames con posición absoluta (NONE layout), los componentes suelen estar modelados como
**hermanos solapados**, no como frames anidados. Antes de construir, reagrupar:

- **Botón:** una forma redondeada pequeña (radius ≥ 8–12, ancho < ~450, alto < ~90, fill
  solid/gradient) **con un texto que la solapa** (overlap > 0.4 o contenido dentro).
  → `add-atomic-button` con texto = el del nodo de texto, bg = fill de la forma,
  color texto = fill del texto, padding ≈ (alto−altoTexto)/2 y (ancho−anchoTexto)/2.
- **Decoración:** elipse/forma grande (> 150px) **sin** texto solapado → tratar como
  imagen de fondo o SVG decorativo, no como contenedor de contenido.
- **Resto:** nodos sueltos → mapear 1:1 por su tipo.

Esto evita que un botón "Rectángulo + Texto" se construya como dos elementos sueltos.

## 8. Detección de elemento decorativo

Rectángulos/elipses con fill **solid o gradient** = decorativos (fondo). Con fill **image**
= contenido (exportar). Un frame es decorativo si todos sus hijos lo son.
