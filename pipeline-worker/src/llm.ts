import { spawn, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env.js";

// Una llamada de texto al modelo.
//  · Con ANTHROPIC_API_KEY → SDK (api.anthropic.com, de pago por token).
//  · Sin key → CLI `claude` headless con tu sesión de Claude Code (suscripción Max/Pro, sin coste).
export async function complete(prompt: string): Promise<string> {
  return env.ANTHROPIC_API_KEY ? viaSdk(prompt) : viaCli(prompt);
}

// Como complete(), pero exige que la respuesta contenga un objeto JSON; reintenta si no.
// Evita el fallo intermitente del CLI (a veces responde en prosa sin JSON).
export async function completeJson(prompt: string, attempts = 3): Promise<string> {
  let last = "";
  for (let i = 0; i < attempts; i++) {
    last = await complete(prompt);
    if (last.includes("{") && last.includes("}")) return last;
  }
  throw new Error(`El modelo no devolvió JSON tras ${attempts} intentos.`);
}

// System prompt mínimo: reemplaza el de Claude Code (orientado a código) para que responda
// como LLM plano y devuelva exactamente el formato pedido.
const CLI_SYSTEM =
  "Sigue las instrucciones al pie de la letra y responde ÚNICAMENTE en el formato solicitado " +
  "(por ejemplo JSON puro o HTML), sin preámbulos, explicaciones ni texto adicional.";

async function viaSdk(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// Resuelve el ejecutable una vez. Lo lanzamos SIN shell: pasar por cmd.exe rompe el EOF de stdin
// en Windows con prompts grandes y claude se cuelga. Directo, el pipe de stdin funciona.
let claudeBin: string | null = null;
function resolveClaudeBin(): string {
  if (claudeBin) return claudeBin;
  if (process.env.CLAUDE_BIN) return (claudeBin = process.env.CLAUDE_BIN);
  if (process.platform === "win32") {
    const r = spawnSync("where", ["claude"], { encoding: "utf8" });
    const lines = (r.stdout || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    claudeBin = lines.find((l) => l.toLowerCase().endsWith(".exe")) || lines[0] || "claude";
  } else {
    claudeBin = "claude";
  }
  return claudeBin;
}

function viaCli(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // --strict-mcp-config + --setting-sources= evitan cargar MCP/skills/hooks (arranque de >60s a ~4s).
    const child = spawn(
      resolveClaudeBin(),
      ["-p", "--output-format", "text", "--strict-mcp-config", "--setting-sources=", "--system-prompt", CLI_SYSTEM],
      { cwd: tmpdir() }
    );
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("claude CLI: timeout (240s)."));
    }, 240_000);

    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(new Error(`No se pudo ejecutar 'claude' (${resolveClaudeBin()}): ${e.message}`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`claude CLI salió con código ${code}: ${err.slice(0, 500)}`));
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}
