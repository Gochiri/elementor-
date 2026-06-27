import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project, CopyResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CopyPage({ params }: { params: { id: string } }) {
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
    .eq("type", "copy")
    .order("created_at", { ascending: false })
    .limit(1);

  const copy = arts?.[0]?.payload as CopyResult | undefined;

  return (
    <main className="wrap" style={{ padding: "32px 24px", maxWidth: 820 }}>
        <Link href={`/projects/${p.id}`} className="muted" style={{ textDecoration: "none" }}>
          ← {p.name}
        </Link>
        <h1 style={{ fontSize: 30, color: "var(--clay-deep)", margin: "10px 0 18px" }}>
          Copy por secciones
        </h1>

        {!copy?.pages?.length ? (
          <div className="card">
            <p className="muted">
              Aún no hay copy generado. Vuelve al proyecto y pulsa «Ejecutar» en el paso ② Copy.
            </p>
          </div>
        ) : (
          copy.pages.map((page, i) => (
            <div className="card" key={i} style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 22, color: "var(--clay-deep)" }}>{page.page}</h2>
              <dl style={{ margin: "10px 0 4px", fontSize: 14 }}>
                <Meta label="Title" value={page.title} />
                <Meta label="Meta" value={page.meta} />
                <Meta label="H1" value={page.h1} />
              </dl>
              {page.sections?.map((s, j) => (
                <section key={j} style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12 }}>
                  <span className="label">{s.name}</span>
                  <h3 style={{ fontSize: 18, margin: "4px 0 6px" }}>{s.heading}</h3>
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{s.body}</p>
                  {s.keywords?.length > 0 && (
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      kw: {s.keywords.join(" · ")}
                    </div>
                  )}
                </section>
              ))}
            </div>
          ))
        )}
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
      <dt className="label" style={{ minWidth: 48 }}>{label}</dt>
      <dd className="muted">{value}</dd>
    </div>
  );
}
