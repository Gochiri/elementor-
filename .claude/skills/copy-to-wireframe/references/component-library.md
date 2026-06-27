# Librería de componentes — wireframe lo-fi (estilo Relume)

Fuente de verdad del paso ③. Todo wireframe usa **solo** estas clases. Limpio, aireado, gris,
sin branding. El worker (`pipeline-worker/src/steps/wireframes.ts`) lee el bloque CSS de aquí
(`loadStyle()`) y refleja estas reglas en su generador determinista de *fallback*.

## CSS (fuente de verdad — el worker lo inyecta tal cual)

```css
:root{--g0:#fff;--g1:#f6f6f5;--g2:#eceae8;--g4:#c7c5c1;--g5:#8a8884;--g6:#3f3d39;--ink:#2a2824;--line:#e4e2de;--mono:ui-monospace,Menlo,Consolas,monospace;--sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--wrap:1080px;}
*{box-sizing:border-box;margin:0;}
body{font-family:var(--sans);background:var(--g2);color:var(--ink);line-height:1.6;}
.board{max-width:var(--wrap);margin:0 auto;padding:32px 20px 96px;}
.pagewrap{margin-bottom:56px;}
.vhead{display:flex;gap:12px;align-items:baseline;margin-bottom:14px;}
.vhead .vn{font:700 12px var(--mono);background:var(--g6);color:#fff;padding:3px 8px;border-radius:4px;}
.vhead h2{font-size:18px;font-weight:700;}
.frame{background:var(--g0);border:1px solid var(--line);border-radius:10px;overflow:hidden;}
.sec{padding:56px;border-bottom:1px solid var(--line);}
.sec:last-child{border-bottom:0;}.sec.tint{background:var(--g1);}
.eyebrow{display:block;font:600 11px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--g5);margin-bottom:14px;}
.h1wf{font-weight:700;font-size:34px;line-height:1.15;letter-spacing:-.02em;max-width:18ch;}
.h2wf{font-weight:700;font-size:24px;line-height:1.2;letter-spacing:-.01em;max-width:22ch;}
.h3wf{font-weight:650;font-size:16px;}
.copy{font-size:14px;color:var(--g5);max-width:48ch;margin-top:14px;}
.btn{display:inline-flex;align-items:center;border:1px solid var(--g6);color:var(--g6);font:600 13px var(--sans);padding:11px 18px;border-radius:6px;}
.btn.solid{background:var(--g6);color:#fff;}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:24px;}
.grid{display:grid;gap:28px;}
.ph{border:1px solid var(--line);background:var(--g1);display:grid;place-content:center;color:var(--g5);font:600 11px var(--mono);letter-spacing:.04em;border-radius:8px;text-align:center;padding:12px;min-height:160px;}
.ico{width:44px;height:44px;border:1px solid var(--g4);border-radius:8px;background:var(--g1);margin-bottom:14px;}
.feat{display:grid;gap:6px;align-content:start;}
.small{font-size:12px;color:var(--g5);margin-top:4px;}
.navwf{display:flex;align-items:center;gap:16px;}.navwf .logo{font-weight:700;font-size:15px;}
.navwf .nlinks{display:flex;gap:16px;margin-left:auto;flex-wrap:wrap;font-size:12px;color:var(--g5);}
.field{border:1px solid var(--line);border-radius:6px;padding:11px 12px;font-size:12px;color:var(--g5);background:var(--g0);}
.formbox{border:1px solid var(--line);border-radius:10px;padding:20px;background:var(--g1);}
.formgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;}
```

## Estructura de página

```html
<section class="pagewrap" id="p-<slug>">
  <div class="vhead"><span class="vn">N</span><h2>Nombre de página</h2></div>
  <div class="frame"><!-- nav · bloques · footer --></div>
</section>
```

## Reglas de densidad (limpio tipo Relume)
- **Copia breve**: cada `body` resúmelo a UNA frase de ≤14 palabras. Es un wireframe.
- **Sin ruido**: NO pongas keywords, ni líneas SEO, ni la línea title/meta.
- Una sección = un bloque. Mucho aire (el padding ya es generoso, no lo toques).
- Inline permitido solo: `grid-template-columns`, `min-height` de `.ph`, `max-width`, `text-align`, `justify-content`, `margin`.

## Catálogo de bloques

**nav** (primer bloque, padding reducido):
```html
<div class="sec" style="padding:18px 56px;"><div class="navwf"><span class="logo">Marca</span><span class="nlinks">Inicio · Carta · …</span><span class="btn solid">Reservar</span></div></div>
```

**hero** (primera sección de contenido, lleva el único H1; imagen grande al lado):
```html
<div class="sec"><div class="grid" style="grid-template-columns:1fr 1fr;align-items:center;"><div><span class="eyebrow">Eyebrow</span><div class="h1wf">H1 corto</div><p class="copy">Una frase.</p><div class="row"><span class="btn solid">CTA</span><span class="btn">Secundario</span></div></div><div class="ph" style="min-height:300px;">Imagen</div></div></div>
```

**icon-feature** (servicios, ventajas, proceso, por qué — 3 columnas con icono):
```html
<div class="sec"><span class="eyebrow">Nombre</span><div class="h2wf">heading</div><div class="grid" style="grid-template-columns:repeat(3,1fr);margin-top:32px;"><div class="feat"><div class="ico"></div><div class="h3wf">Punto</div><p class="small">Frase corta.</p></div><div class="feat"><div class="ico"></div><div class="h3wf">Punto</div><p class="small">Frase corta.</p></div><div class="feat"><div class="ico"></div><div class="h3wf">Punto</div><p class="small">Frase corta.</p></div></div></div>
```

**grid de tarjetas** (carta, menú, productos, galería — placeholders etiquetados con el contenido real):
```html
<div class="sec tint"><span class="eyebrow">Nombre</span><div class="h2wf">heading</div><div class="grid" style="grid-template-columns:repeat(3,1fr);margin-top:32px;"><div><div class="ph" style="min-height:180px;">Cochinita pibil</div><div class="h3wf" style="margin-top:12px;">Cochinita pibil</div></div><div><div class="ph" style="min-height:180px;">Enchiladas</div><div class="h3wf" style="margin-top:12px;">Enchiladas</div></div><div><div class="ph" style="min-height:180px;">Tacos</div><div class="h3wf" style="margin-top:12px;">Tacos</div></div></div><div class="row"><span class="btn">Ver todo</span></div></div>
```

**mapa** (ubicación / cómo llegar):
```html
<div class="sec tint"><div class="grid" style="grid-template-columns:1fr 1fr;align-items:center;"><div><span class="eyebrow">Nombre</span><div class="h2wf">heading</div><p class="copy">Una frase.</p><div class="row"><span class="btn solid">Cómo llegar</span></div></div><div class="ph" style="min-height:200px;">Mapa</div></div></div>
```

**CTA** (cierre/conversión — centrado, estrecho):
```html
<div class="sec tint"><div style="text-align:center;max-width:40ch;margin:0 auto;"><span class="eyebrow">Nombre</span><div class="h2wf" style="max-width:none;">heading</div><p class="copy" style="max-width:none;margin:14px auto 0;">Una frase.</p><div class="row" style="justify-content:center;"><span class="btn solid">Contactar</span><span class="btn">Llamar</span></div></div></div>
```

**formulario** (reserva/contacto con campos):
```html
<div class="sec"><div class="grid" style="grid-template-columns:1fr 1fr;align-items:center;"><div><span class="eyebrow">Reserva</span><div class="h2wf">heading</div><p class="copy">Una frase.</p></div><div class="formbox"><div class="h3wf">Reserva tu mesa</div><div class="formgrid"><span class="field">Fecha</span><span class="field">Personas</span><span class="field">Hora</span><span class="field">Teléfono</span></div><div class="row"><span class="btn solid" style="width:100%;justify-content:center;">Reservar</span></div></div></div></div>
```

**footer** (último bloque, padding reducido):
```html
<div class="sec tint" style="padding:28px 56px;"><div class="navwf"><span class="logo">Marca</span><span class="nlinks">© Marca</span></div></div>
```

## Reglas sección → bloque

| Si el `name`/intención sugiere… | Bloque |
|---|---|
| Primera sección de la página | **hero** (con el H1) |
| servicio, ventaja, por qué, proceso, cómo funciona, beneficio, garantía, característica | **icon-feature** |
| carta, menú, producto, galería, tipos, eventos, platos, antojito, bebida, entrante, especialidad | **grid de tarjetas** |
| mapa, cómo llegar, dirección, ubicación, dónde estamos | **mapa** |
| reserva/contacto con campos | **formulario** |
| cta, reservar, contactar, presupuesto, visítanos, pedir, solicita, llamar, compra | **CTA** |
| cualquier otra | **zigzag** (texto + imagen alternando lado, alternar `.tint`) |
