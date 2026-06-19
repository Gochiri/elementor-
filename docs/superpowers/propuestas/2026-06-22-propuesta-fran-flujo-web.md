# Propuesta — Optimización del flujo de creación web (departamento web)

**Para:** Fran (con Senia y Alberto)
**De:** equipo Ómibu / OVNIA
**Fecha:** 22-jun-2026
**Asunto:** primeras ideas para recortar el tiempo de producción web, por fases y testeadas

---

## En una línea

Podemos quitar los pasos que hoy generan fricción y errores (el GEM de Gemini y los cortes de Relume), conectar el keyword research directamente a la generación, y automatizar el trasvase a Elementor con un proceso que ya tenemos validado — **conservando Figma** como capa de diseño y aprobación, tal como pide Alberto. Objetivo realista de una primera fase: pasar de **6-8 h a ~4 h** por proyecto de servicios.

---

## 1. Cómo se ve el flujo hoy

```
Briefing → Excel (estructura) → GEM Gemini (prompt) → Relume (wireframe + copy)
        → edición manual → Figma → Elementor (a mano)
```

Dónde se va el tiempo y dónde se pierde calidad:

- **El GEM de Gemini** es un paso intermedio manual: copiar el briefing y la estructura para que devuelva un prompt.
- **Relume corta el prompt a 5.000 caracteres.** Cuando Senia pide acortar, se pierde información que luego hay que volver a meter a mano.
- **El keyword research (SE Ranking) se hace aparte** y no alimenta la generación; queda como referencia manual.
- **El paso de Figma a Elementor es 100% manual** — la parte más tediosa, y donde más horas se van.

---

## 2. Tres ideas concretas

### Idea 1 — Conectar el keyword research a la generación
Hoy el estudio de palabras clave en SE Ranking se hace por separado. Lo conectamos para que **alimente directamente la estructura y el copy**: cada bloque nace ya con su keyword, volumen, dificultad e intención.
- **Elimina:** el copiar/pegar manual entre el research y el wireframe.
- **Conserva:** SE Ranking como proveedor de datos (no se cambia de herramienta).

### Idea 2 — Consolidar el paso de Gemini y aliviar/reemplazar Relume
En lugar de pasar por el GEM y luego por Relume con su límite de caracteres, generamos **estructura + copy por secciones**, sin cortes y sin perder info.
- **Elimina:** el GEM de Gemini como paso aparte y el problema de los 5.000 caracteres.
- **A probar (no decidido):** lo compararemos contra Relume en un piloto, midiendo cuánto retoque manual queda y la calidad del copy. Si Relume sigue aportando por su librería visual, se mantiene; si no, se reemplaza.

### Idea 3 — Automatizar el trasvase a Elementor
El paso de diseño a Elementor lo automatizamos con un proceso que **ya validamos en producción**: construye en Elementor con elementos nativos (no código pegado), por lo que la web queda **autogestionable por el cliente** — justo lo que Alberto remarca como innegociable.
- **Elimina:** las horas de maquetado manual.
- **Conserva:** la edición nativa; nada de bloques de código que aten al cliente.

---

## 3. Enfoque por fases (respeta la parte manual de Alberto)

- **Fase 1 — conserva Figma.** Figma sigue siendo la capa de **sistema de diseño + tokens + aprobación visual** del cliente. Automatizamos lo de antes (keyword research, estructura, copy) y lo de después (trasvase a Elementor), sin tocar el criterio de diseño de Alberto. Es el cambio de menor riesgo.
- **Fase 2 — piloto en paralelo, en staging.** Probamos la ruta directa **sin Figma** (briefing → Elementor) y secciones reutilizables que se añaden con un clic. Esto **no se promete al cliente todavía**; se mide en pruebas internas y, si rinde, se adopta.

Esto encaja con tu idea de ir de fácil a complejo y en doble fase, empezando por una web de servicios "S" sin integraciones.

---

## 4. Cómo mediremos que funciona (sin promesas de marketing)

Lo validamos en staging con un caso real antes de comprometer producción:

- Proyecto de servicios "S": de **6-8 h → ≤ 4 h**.
- Keyword research dentro de la estructura **sin paso manual** de copiar/pegar.
- El wireframe/copy generado requiere **< 30 min** de retoque y **sin pérdida de info** por límite de caracteres.
- La web abre **100% editable/autogestionable** en Elementor en **≥ 90%** de las secciones.

---

## 5. Qué necesitamos de vosotros para arrancar

- El **briefing + el prompt/output de Relume** de un caso real (Kau Interiorismo o Asesoría Energética Santander) — el que ya quedasteis en enviar — para correr la prueba con datos reales y comparar tiempos contra el proceso actual.

---

> Esto es un **primer paso testeado**, no la solución definitiva. La idea es validarlo con un caso real, medir, y a partir de ahí decidir juntos los siguientes pasos.
