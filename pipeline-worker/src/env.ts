import "dotenv/config";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name} (ver .env.example)`);
  return v;
}

export const env = {
  SUPABASE_URL: req("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: req("SUPABASE_SERVICE_ROLE_KEY"),
  // Opcional al arrancar: el paso ③ (wireframes) no usa LLM. ①② fallan con mensaje claro si falta.
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  POLL_INTERVAL_MS: Number(process.env.POLL_INTERVAL_MS ?? "5000"),
  // SE Ranking Data API (opcional; sin ella el paso ① deja keywords sin métricas)
  SERANKING_API_KEY: process.env.SERANKING_API_KEY ?? "",
  SERANKING_SOURCE: process.env.SERANKING_SOURCE ?? "es",
};
