"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const fn =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (mode === "signup") {
      setError("Cuenta creada. Si tu Supabase pide confirmación por email, revisa tu bandeja; si no, ya puedes entrar.");
      setMode("login");
      return;
    }
    router.replace("/projects");
    router.refresh();
  }

  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <form onSubmit={submit} className="card" style={{ width: 360 }}>
        <h1 style={{ fontSize: 24, color: "var(--clay-deep)", marginBottom: 4 }}>Pipeline</h1>
        <p className="muted" style={{ marginBottom: 18 }}>
          {mode === "login" ? "Entra con tu cuenta del equipo." : "Crea tu cuenta."}
        </p>
        <div className="field">
          <span className="label">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="field">
          <span className="label">Contraseña</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="current-password" />
        </div>
        {error && <p className="muted" style={{ color: "var(--st-error)", marginBottom: 12 }}>{error}</p>}
        <button className="btn solid" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
          {loading ? "..." : mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>
        <button
          type="button"
          className="btn ghost"
          style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
        >
          {mode === "login" ? "No tengo cuenta" : "Ya tengo cuenta"}
        </button>
      </form>
    </main>
  );
}
