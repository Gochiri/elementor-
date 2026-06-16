# Playbook de primer intento (Figma → Elementor v4)

Aplica esto de entrada para que el PRIMER render salga casi fiel y el loop de
verificación converja en 1-2 vueltas. Resume todo lo aprendido. `{P}` = post_id.

## Orden de operaciones (siempre)
1. `detect-elementor-version` (confirmar atómico v4).
2. **Construir TODA la estructura** con `add-flexbox` / `add-atomic-*` y guardar cada
   `element_id`. NO intentar estilar con `update-atomic-widget` (no renderiza).
3. Subir imágenes: `download_assets(png, scale 2-4)` → `sideload-image` → guardar URL WP.
4. **UN solo** `update-page-settings` con TODO el `custom_css` (selector `[data-id="ID"]`).
5. Publicar (los borradores no se ven) → render headless → screenshot → comparar → ajustar
   el `custom_css` (reenviar completo, reemplaza). Verificar persistencia con
   `get-element-settings`, nunca confiar en `success:true`.

## Reglas de oro de layout (memorizar)
- Flexbox atómico **CRECE por defecto** (`flex-grow:1`).
  - Elemento de tamaño fijo (logo, imagen, grupo de menú) → `flex:0 0 auto !important`.
  - Elemento que debe llenar el resto (columna de texto) → `flex:1 !important`.
- `add-flexbox` con `gap:0` es inválido → omitir el gap.
- Imagen de Figma = `background-image` en un flexbox (NO `add-atomic-image`, está roto).
- Matte de PNG = color del frame de Figma (a menudo `#f4f4f4`): muestrear con canvas
  (`getImageData(2,2,1,1)`) y poner ese color como `background-color` de la sección.

## Contenedor centrado tipo Figma (~1300px)
```css
body.page-id-{P} [data-id="{SECTION}"]{padding:24px 40px 64px !important;align-items:center !important;background-color:#f4f4f4 !important;}
body.page-id-{P} [data-id="{ROW}"]{width:100% !important;max-width:1300px !important;margin:0 auto !important;}
```

## Snippets por tipo de elemento

### Heading (título)
```css
body.page-id-{P} [data-id="{ID}"]{color:#0c0d18 !important;font-size:{PX}px !important;line-height:{PX}px !important;font-weight:600 !important;letter-spacing:0.2px !important;}
```
Peso: usar la tabla de `figma-heuristics.md` (SemiBold→600, Bold→700…).
Tag por tamaño: ≥56→h1, ≥42→h2, ≥32→h3 (ver heurísticas).

### Párrafo / subtítulo
```css
body.page-id-{P} [data-id="{ID}"]{color:#6e6e6e !important;font-size:15px !important;line-height:24px !important;margin:0 !important;}
```

### Botón filled
```css
body.page-id-{P} [data-id="{ID}"], body.page-id-{P} [data-id="{ID}"] *{background-color:{BG} !important;color:#fff !important;border:none !important;border-radius:0 !important;font-size:16px !important;}
body.page-id-{P} [data-id="{ID}"]{padding:11px 25px !important;}
```
### Botón outline
```css
body.page-id-{P} [data-id="{ID}"], body.page-id-{P} [data-id="{ID}"] *{background-color:#fff !important;color:#0c0d18 !important;border-radius:0 !important;font-size:16px !important;}
body.page-id-{P} [data-id="{ID}"]{padding:11px 25px !important;border:1px solid #0c0d18 !important;}
```

### Imagen / logo / decoración (fondo)
```css
body.page-id-{P} [data-id="{ID}"]{background-image:url('{WP_URL}') !important;background-color:transparent !important;background-size:contain !important;background-repeat:no-repeat !important;background-position:center !important;width:{W}px !important;min-width:{W}px !important;height:{H}px !important;flex:0 0 auto !important;}
```
(Para imagen que llena su columna: `flex:1 1 55%`, `background-size:cover`, sin width fijo.)

### Navbar (logo izq + menú der)
```css
/* fila: justify space-between al crear; menú a ancho de contenido para que se vaya a la derecha */
body.page-id-{P} [data-id="{NAVROW}"]{width:100% !important;max-width:1300px !important;margin:0 auto !important;}
body.page-id-{P} [data-id="{MENU}"]{flex:0 0 auto !important;width:auto !important;gap:34px !important;}
body.page-id-{P} [data-id="{LOGO}"]{background-image:url('{LOGO_URL}') !important;background-size:contain !important;background-repeat:no-repeat !important;background-position:left center !important;width:120px !important;min-width:120px !important;height:29px !important;flex:0 0 auto !important;}
/* links del menú */
body.page-id-{P} [data-id="{LINK}"]{color:#0c0d18 !important;font-size:16px !important;font-weight:500 !important;margin:0 !important;white-space:nowrap !important;cursor:pointer !important;}
```

### Acordeón (widget legacy `add-accordion`, funciona en página atómica)
```css
body.page-id-{P} .elementor-accordion .elementor-accordion-item{border:none !important;border-top:1px solid #eee !important;background:transparent !important;}
body.page-id-{P} .elementor-accordion .elementor-accordion-item:first-child{border-top:none !important;}
body.page-id-{P} .elementor-accordion .elementor-tab-title,
body.page-id-{P} .elementor-accordion .elementor-tab-title a,
body.page-id-{P} .elementor-accordion .elementor-tab-title.elementor-active,
body.page-id-{P} .elementor-accordion .elementor-tab-title.elementor-active a{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif !important;font-weight:700 !important;font-size:20px !important;color:#000 !important;text-decoration:none !important;}
body.page-id-{P} .elementor-accordion .elementor-tab-content{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif !important;font-size:15px !important;line-height:24px !important;color:#000 !important;}
```

## Checklist antes de declarar "fiel"
- [ ] Colores exactos del `get_design_context` (no aproximados).
- [ ] Textos literales (copiar del nodo, con tildes y `…`).
- [ ] Imágenes subidas y como `background-image` (no atomic-image).
- [ ] `flex:0 0 auto` en fijos, `flex:1` en los que llenan.
- [ ] Sección centrada `max-width:1300` + `align-items:center`.
- [ ] Fondo de sección = color de la matte de los PNG (si hay imágenes).
- [ ] Componentes interactivos (acordeón/tabs) como widget real, no divs.
- [ ] Publicado + verificado en navegador a 1440px.
