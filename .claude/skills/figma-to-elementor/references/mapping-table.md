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
