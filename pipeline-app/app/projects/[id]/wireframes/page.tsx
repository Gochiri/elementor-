import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WireframesPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!project) notFound();
  const p = project as Project;

  const { data: arts } = await supabase
    .from("artifacts")
    .select("payload")
    .eq("project_id", p.id)
    .eq("type", "wireframe")
    .order("created_at", { ascending: false })
    .limit(1);

  const html = (arts?.[0]?.payload as { html?: string } | undefined)?.html;

  return (
    <main className="wrap" style={{ padding: "32px 24px" }}>
        <Link href={`/projects/${p.id}`} className="muted" style={{ textDecoration: "none" }}>
          ← {p.name}
        </Link>
        <h1 style={{ fontSize: 30, color: "var(--clay-deep)", margin: "10px 0 18px" }}>Wireframes</h1>

        {!html ? (
          <div className="card">
            <p className="muted">
              Aún no hay wireframes. Vuelve al proyecto y pulsa «Ejecutar» en el paso ③ (necesita el paso ② Copy hecho).
            </p>
          </div>
        ) : (
          <iframe
            title="Wireframes"
            srcDoc={html}
            sandbox="allow-same-origin"
            style={{ width: "100%", height: "80vh", border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }}
          />
        )}
    </main>
  );
}
