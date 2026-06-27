import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FigmaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { step?: string };
}) {
  const supabase = createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!project) notFound();
  const p = project as Project;

  const step = Number(searchParams.step);
  let q = supabase.from("artifacts").select("url").eq("project_id", p.id).eq("type", "figma");
  if (Number.isInteger(step)) q = q.eq("step", step);
  const { data: arts } = await q.order("created_at", { ascending: false }).limit(1);

  const label = step === 5 ? "Figma hi-fi" : step === 4 ? "Wireframes en Figma" : "Figma";

  const fileUrl = arts?.[0]?.url ?? null;
  const embed = fileUrl
    ? `https://www.figma.com/embed?embed_host=pipeline&url=${encodeURIComponent(fileUrl)}`
    : null;

  return (
    <main className="wrap" style={{ padding: "32px 24px" }}>
        <Link href={`/projects/${p.id}`} className="muted" style={{ textDecoration: "none" }}>
          ← {p.name}
        </Link>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "10px 0 18px" }}>
          <h1 style={{ fontSize: 30, color: "var(--clay-deep)" }}>{label}</h1>
          {fileUrl && (
            <a className="muted" href={fileUrl} target="_blank" rel="noreferrer">abrir en Figma ↗</a>
          )}
        </div>

        {!embed ? (
          <div className="card">
            <p className="muted">
              Aún no hay Figma. Captura el wireframe a Figma y guarda el link en el paso ④.
            </p>
          </div>
        ) : (
          <iframe
            title="Figma"
            src={embed}
            allowFullScreen
            style={{ width: "100%", height: "80vh", border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }}
          />
        )}
    </main>
  );
}
