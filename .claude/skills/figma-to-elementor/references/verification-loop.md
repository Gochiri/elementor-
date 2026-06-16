# Loop de verificación visual (por sección)

Se ejecuta justo después de construir cada sección.

## Procedimiento
1. **Render:** navegar el sitio en vivo a la página destino (navegador headless).
2. **Capturar:** screenshot de la sección recién construida.
3. **Comparar:** Figma screenshot vs Elementor render, lado a lado.
4. **Diagnosticar:** clasificar discrepancias en:
   - Espaciado (padding/gap)   - Color (token mal mapeado)
   - Tipografía (tamaño/peso)  - Alineación / dirección flex
   - Texto (contenido/salto)   - Asset (imagen/escala/fit)
5. **Corregir:** `update-element` / `batch-update` / `update-atomic-widget`.
6. **Repetir** desde el paso 2 hasta "fiel" o tope de iteraciones.

## Reglas de parada
- **Tope: 3 iteraciones por sección.** Tras 3 vueltas, diferencias menores se
  registran como deuda (no bloquean).
- **Umbral "fiel":** discrepancias estructurales (layout, color, texto, fuente) se
  corrigen siempre; diferencias sub-píxel de espaciado son aceptables.

## Manejo de errores
- Asset que no descarga/sube → placeholder + anotar, no abortar.
- Elemento sin widget equivalente → mapear al más cercano + anotar.
- Llamada de Elementor falla → reintentar esa llamada sola (el troceo evita perder la
  sección entera).

## Estado por sección (para el reporte)
- `✅ fiel`
- `⚠️ fiel con deuda menor` + lista de diferencias residuales
- `❌ requiere intervención manual` + motivo
