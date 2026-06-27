import Link from "next/link";
import { createProject } from "../actions";

export default function NewProjectPage() {
  return (
    <>
      <Link href="/projects" className="muted" style={{ textDecoration: "none" }}>← Panel</Link>
      <div className="form-panel">
        <h1>Nuevo proyecto</h1>
        <form action={createProject}>
          <div className="field">
            <span className="label">Nombre del cliente *</span>
            <input name="name" required placeholder="Ágave Azul" />
          </div>
          <div className="field">
            <span className="label">Dominio</span>
            <input name="domain" placeholder="agaveazul.es" />
          </div>
          <div className="field">
            <span className="label">Briefing — Google Docs (un link por línea)</span>
            <textarea name="briefing_doc_urls" rows={2} placeholder={"https://docs.google.com/document/...\nhttps://docs.google.com/document/..."} />
          </div>
          <div className="field">
            <span className="label">Estructura — Google Sheets (un link por línea)</span>
            <textarea name="structure_sheet_urls" rows={2} placeholder={"https://docs.google.com/spreadsheets/..."} />
          </div>
          <div className="field">
            <span className="label">Relume (opcional, un link por línea)</span>
            <textarea name="relume_urls" rows={2} placeholder={"https://relume.io/app/project/..."} />
          </div>
          <button className="btn solid" style={{ width: "100%", justifyContent: "center" }}>Crear proyecto</button>
        </form>
      </div>
    </>
  );
}
