import { supabase } from "./supabase.js";
import { runStep } from "./runner.js";
import { env } from "./env.js";
import type { StepState } from "./types.js";

// ponytail: 1 worker, lock en memoria. Si algún día hay varios workers, añadir claim atómico en DB.
let busy = false;

async function tick(): Promise<void> {
  if (busy) return;
  // Un paso en cola = step_state en 'running' (la UI lo marca al pulsar "Ejecutar").
  const { data, error } = await supabase
    .from("step_states")
    .select("*")
    .eq("status", "running")
    .order("updated_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("Error consultando cola:", error.message);
    return;
  }
  const next = data?.[0] as StepState | undefined;
  if (!next) return;

  busy = true;
  console.log(`▶ proyecto ${next.project_id} · paso ${next.step}`);
  try {
    await runStep(next);
  } finally {
    busy = false;
  }
}

console.log(`pipeline-worker arrancado. Poll cada ${env.POLL_INTERVAL_MS} ms.`);
setInterval(() => void tick().catch((e) => console.error(e)), env.POLL_INTERVAL_MS);
void tick();
