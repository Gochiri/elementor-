"use client";

import { useState } from "react";

export function DeleteProject({
  projectId,
  projectName,
  action,
}: {
  projectId: string;
  projectName: string;
  action: (formData: FormData) => void;
}) {
  const [typed, setTyped] = useState("");
  const armed = typed.trim() === projectName;

  return (
    <details className="danger">
      <summary>Eliminar proyecto</summary>
      <div className="danger-body">
        <p>
          Esto borra <b>{projectName}</b> y todo su trabajo (los 8 pasos y sus artefactos).
          No se puede deshacer. Escribe el nombre del proyecto para confirmar.
        </p>
        <form action={action} className="danger-form">
          <input type="hidden" name="projectId" value={projectId} />
          <input
            className="danger-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={projectName}
            aria-label={`Escribe «${projectName}» para confirmar el borrado`}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="btn danger-btn" type="submit" disabled={!armed}>
            Eliminar definitivamente
          </button>
        </form>
      </div>
    </details>
  );
}
