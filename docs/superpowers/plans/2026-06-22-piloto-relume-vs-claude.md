# Piloto A/B — Relume vs Claude (generación de estructura + copy)

**Fecha:** 2026-06-22
**Objetivo:** decidir, con datos, si Claude reemplaza a Relume en la generación de wireframe/copy, o si Relume se conserva por su librería visual de bloques. Decisión tomada en planificación: **probar ambos y comparar** (no asumir).

**Contexto:** en el flujo actual de Senia, el GEM de Gemini genera un prompt → Relume genera wireframe + copy (con corte a 5.000 caracteres). Queremos medir si generar estructura+copy con Claude, por secciones y sin corte, da mejor resultado con menos retoque manual.

---

## Input común (mismo punto de partida para A y B)

- **Briefing real** del caso de prueba (Kau Interiorismo o Asesoría Energética Santander), pendiente de que SEMIA lo envíe.
- **Keyword research** de SE Ranking del mismo caso (palabras clave con volumen/dificultad/intención).
- **Misma estructura objetivo** (bloques: hero H1+promesa+CTA, intro, servicios, etc.).
- **Tipo de web:** servicios "S", sin integraciones complejas.

---

## Vía A — Relume (proceso actual, optimizado)

1. Mejorar el prompt para Relume: en vez de un único prompt de >5.000 char que se corta, **trocear por secciones** (probar la opción de Relume de prompt por página/sección/elemento que Alberto mencionó).
2. Generar wireframe + copy en Relume.
3. Edición manual hasta dejarlo listo para Figma.

## Vía B — Claude (estructura + copy directos)

1. Briefing + keywords → Claude genera el **Section Plan (IR)** según `.claude/skills/figma-to-elementor/references/ir-schema.md`, con copy SEO **por secciones** (sin límite de caracteres).
2. Revisar el IR contra el esquema (validación de contrato).
3. Edición manual hasta dejarlo listo para Figma / Elementor.

---

## Métricas (idénticas para A y B)

| Métrica | Cómo se mide |
|---|---|
| **Tiempo de retoque manual** | minutos desde "generado" hasta "listo para diseño" |
| **Fidelidad SEO** | % de bloques que llegan con su keyword/intención correcta sin corregir a mano |
| **Pérdida de info** | nº de datos del briefing que se perdieron y hubo que re-añadir |
| **Calidad del copy** | escala 1-5 (¿sirve tal cual / con retoque menor / se descarta?) |
| **Limpieza de salida** | duplicados, Lorem Ipsum, bloques no borrables (problemas hoy de Relume→Figma) |
| **Tiempo total de la fase** | de briefing a "listo para Figma" |

---

## Tabla de resultados — caso Ágave Azul (2026-06-25)

> **Caso real usado:** Ágave Azul (restaurante mexicano + obrador, Santander), no Kau/Asesoría Energética (que aún no llegó). Briefing: doc de Google del cliente.
> **Asimetría de alcance (importante para leer la tabla):** Relume generó **el sitio completo** (8 páginas) de una pasada; la vía Claude hizo keyword research (SE Ranking) + copy completo de **2 páginas** (Inicio, Obrador) y briefed las otras 6. Se compara calidad/limpieza/SEO por página generada, no volumen total. La salida de Relume puede incluir retoques manuales del equipo (Senia/Alberto) posteriores a la generación; las viñetas `.` vacías y erratas sugieren que está bastante en crudo.

| Métrica | Vía A (Relume) | Vía B (Claude) | Ganador |
|---|---|---|---|
| Tiempo de retoque manual | Alto — limpiar bloques `.` vacíos, corregir página mal etiquetada (Obrador rotulado "El restaurante"), erratas, **y añadir toda la capa SEO inexistente** | Bajo — copy llega limpio y mapeado a keyword/intención; falta completar 6 páginas y validar tono con cliente | **B** |
| Fidelidad SEO | Baja — sin title/meta, sin keyword por sección, sin intención ni schema; H1 genéricos | Alta — cada sección con keyword + vol/dif/intención (SE Ranking), title+meta por página, clustering pillar/spoke, evita genéricos inviables | **B** |
| Pérdida de info | Media — cubre mucho del briefing pero deja huecos placeholder e inventa algún dato | Baja — conserva todo el briefing y lo mapea a arquitectura | **B** (leve) |
| Calidad del copy (1-5) | **4** — voz mexicana con chispa, variada y creativa | **4** — profesional, on-brief (el cliente pidió "profesional"), keyword-natural; menos juguetón | **Empate** |
| Limpieza de salida | Baja — viñetas `.` vacías, cifras duplicadas entre páginas, página mal rotulada, erratas ("Food struck", "diselo") | Alta — markdown limpio, sin Lorem ni placeholders | **B** |
| Tiempo total de la fase | Rápido a "borrador de sitio completo", pero exige retrofit SEO grande después | Más lento por página, pero llega **SEO-ready y limpio** (sin segunda pasada SEO) | **Depende** (ver decisión) |

---

## Decisión (2026-06-25): **Híbrido**

- **Claude para estructura + SEO + copy** (lo que gana de forma clara: fidelidad SEO, limpieza, menos retoque). Es la espina dorsal del flujo.
- **Relume opcional como explorador visual de bloques** — su fuerza real es la librería de bloques y la voz creativa, no el SEO. Útil para inspirar variedad de secciones, no como fuente de copy/estructura definitiva.
- Cumple el criterio del doc: la Vía B gana en pérdida de info y en limpieza, con calidad de copy ≥ a la Vía A; no la reemplaza al 100% solo porque la exploración visual rápida de Relume aún aporta.

**Pendiente para cerrar el piloto con datos duros:** repetir con un caso "S" puro (servicios, sin la complejidad multi-marca de Ágave Azul) **cronometrando minutos reales** de retoque en ambas vías, y a igual alcance (mismas páginas).

---

## Criterio de decisión

- **Reemplazar Relume por Claude** si la Vía B gana en tiempo total **y** en pérdida de info, con calidad de copy ≥ a la Vía A.
- **Conservar Relume** si su librería visual de bloques aporta valor que la Vía B no iguala (exploración visual rápida) y el coste de tiempo es comparable.
- **Híbrido** si conviene: Claude para estructura+copy, Relume solo como referencia visual de bloques.

> Registrar el resultado y la decisión en este doc, y reflejar el aprendizaje en el skill `figma-to-elementor` (memorias/refs) para el siguiente proyecto.
