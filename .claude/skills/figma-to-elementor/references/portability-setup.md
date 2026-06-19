# Portabilidad: correr la skill en desktop, web y Antigravity

Diagnóstico 2026-06-18. Separa el CONOCIMIENTO (markdown, ya portable) de las
DEPENDENCIAS (los MCP + navegador, que se configuran por entorno).

## Cómo corren los MCP (clave para la portabilidad)

| MCP | Función | Transporte | Portable |
|---|---|---|---|
| **figma** | leer diseños | **HTTP remoto** → `https://mcp.figma.com/mcp` | ✅ cualquier entorno (OAuth) |
| **elementor-mcp** | construir páginas | **HTTP remoto** → `https://TU-WORDPRESS/wp-json/mcp/elementor-mcp-server` (plugin MCP dentro del propio WordPress, auth Basic) | ✅ cualquier entorno con el header |
| **playwright** | verificar (navegador headless) | **Local stdio** (`npx @playwright/mcp`) | ⚠️ solo desktop; reemplazable por el navegador del entorno |

**Conclusión:** los DOS MCP que construyen (Figma + Elementor) son **remotos**, no locales.
Por eso la construcción funciona igual en desktop, web y Antigravity con la misma config.
Lo único local es el navegador de verificación, y solo afecta el paso de comparación visual.

## Estado por entorno

- **Claude Code desktop** → ✅ completo (ya funciona).
- **Claude Code web** → ✅ Figma + Elementor (remotos). Falta: (a) que la skill esté
  sincronizada al workspace web; (b) navegador de verificación (usar el del entorno o un
  browser-MCP remoto en vez de Playwright local).
- **Antigravity** (u otro agente que NO lee skills de Claude Code) → los MCP HTTP se
  configuran igual. Falta: (a) **espejar este conocimiento como reglas** (p. ej. `AGENTS.md`),
  porque no auto-carga `SKILL.md`; (b) configurar los MCP en su gestor; (c) navegador.

## Setup mínimo en un entorno nuevo

### Lado WordPress (una sola vez por instalación)
Los dos plugins que habilitan el endpoint MCP están versionados en la raíz del repo:
`mcp-adapter.zip` (adapter MCP genérico) y `emcp-tools-2.0.0.zip` (herramientas Elementor MCP).
1. WordPress → **Plugins → Añadir nuevo → Subir plugin** → subir **`mcp-adapter.zip`** y
   **`emcp-tools-2.0.0.zip`**, y **activar ambos** (primero el adapter).
2. Generar un **Application Password**: Usuarios → tu perfil → *Application Passwords* →
   crear uno; copiar el valor (se muestra **una sola vez**).
3. El endpoint queda en `https://TU-WORDPRESS/wp-json/mcp/elementor-mcp-server`.

### Lado agente
1. Conectar **figma** MCP (HTTP `https://mcp.figma.com/mcp`, login OAuth).
2. Conectar **elementor-mcp** MCP (HTTP al endpoint de arriba, con header
   `Authorization: Basic <base64(usuario:application-password)>`).
3. Disponer de un **navegador** para verificar (Playwright local, browser-MCP remoto, o el
   navegador nativo del entorno).
4. Poner el conocimiento delante del agente: skill nativa (Claude Code) o archivo de reglas
   (Antigravity/otros).

## ⚠️ Seguridad del credencial
- El Elementor MCP se autentica con un **WordPress Application Password** en un header Basic,
  guardado en texto plano en `.claude.json`. **No está en este repo y no debe estarlo.**
- Al llevarlo a otro entorno, trátalo como secreto: no lo pegues en sitios inseguros ni lo
  subas a git. Si se expone, **rótalo** en WordPress (Usuarios → Application Passwords) y
  actualiza la config.

## Pendiente para portabilidad completa (no implementado aún)
- `AGENTS.md` espejo del conocimiento (para Antigravity y agentes sin skills).
- Tabla de mapeo capacidad→herramienta por plataforma (hacer el conocimiento agnóstico de
  nombres de tool).
- Decisión del navegador de verificación por entorno.
