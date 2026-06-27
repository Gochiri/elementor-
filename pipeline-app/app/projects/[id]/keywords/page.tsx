import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project, KeywordResearch } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function KeywordsPage({ params }: { params: { id: string } }) {
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
    .eq("type", "keyword_research")
    .order("created_at", { ascending: false })
    .limit(1);

  const kr = arts?.[0]?.payload as KeywordResearch | undefined;

  return (
    <main className="wrap" style={{ padding: "32px 24px", maxWidth: 900 }}>
        <Link href={`/projects/${p.id}`} className="muted" style={{ textDecoration: "none" }}>
          ← {p.name}
        </Link>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "10px 0 18px" }}>
          <h1 style={{ fontSize: 30, color: "var(--clay-deep)" }}>Keyword research</h1>
          {kr && (
            <span className="muted">
              base {kr.source}
              {!kr.enriched && " · candidatas (sin métricas SE Ranking)"}
            </span>
          )}
        </div>

        {!kr?.pages?.length ? (
          <div className="card">
            <p className="muted">
              Aún no hay keyword research. Vuelve al proyecto y pulsa «Ejecutar» en el paso ①.
            </p>
          </div>
        ) : (
          kr.pages.map((page, i) => (
            <div className="card" key={i} style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 20, color: "var(--clay-deep)", marginBottom: 10 }}>{page.page}</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--ink-soft)" }}>
                    <th style={th}>Keyword</th>
                    <th style={thNum}>Vol.</th>
                    <th style={thNum}>Dif.</th>
                    <th style={th}>Intención</th>
                  </tr>
                </thead>
                <tbody>
                  {page.keywords.map((k, j) => (
                    <tr key={j} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={td}>{k.keyword}</td>
                      <td style={tdNum}>{k.volume ?? "—"}</td>
                      <td style={tdNum}>{k.difficulty ?? "—"}</td>
                      <td style={{ ...td, color: "var(--ink-soft)" }}>{k.intent ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
    </main>
  );
}

const th: React.CSSProperties = { padding: "6px 8px", fontWeight: 600 };
const thNum: React.CSSProperties = { ...th, textAlign: "right", width: 70 };
const td: React.CSSProperties = { padding: "7px 8px" };
const tdNum: React.CSSProperties = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };
