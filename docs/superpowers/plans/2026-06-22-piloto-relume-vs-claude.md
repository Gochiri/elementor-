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

## Tabla de resultados (a rellenar tras el piloto)

| Métrica | Vía A (Relume) | Vía B (Claude) | Ganador |
|---|---|---|---|
| Tiempo de retoque manual | | | |
| Fidelidad SEO | | | |
| Pérdida de info | | | |
| Calidad del copy (1-5) | | | |
| Limpieza de salida | | | |
| Tiempo total de la fase | | | |

---

## Criterio de decisión

- **Reemplazar Relume por Claude** si la Vía B gana en tiempo total **y** en pérdida de info, con calidad de copy ≥ a la Vía A.
- **Conservar Relume** si su librería visual de bloques aporta valor que la Vía B no iguala (exploración visual rápida) y el coste de tiempo es comparable.
- **Híbrido** si conviene: Claude para estructura+copy, Relume solo como referencia visual de bloques.

> Registrar el resultado y la decisión en este doc, y reflejar el aprendizaje en el skill `figma-to-elementor` (memorias/refs) para el siguiente proyecto.
