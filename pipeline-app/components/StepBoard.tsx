import { PIPELINE_STEPS, type StepState, type Artifact, type StepStatus } from "@/lib/types";
import { enqueueStep, approveHifi, saveFigmaLink } from "@/app/projects/[id]/actions";

const STATUS_LABEL: Record<StepStatus, string> = {
  pending: "pendiente",
  running: "en curso",
  needs_review: "revisión",
  done: "hecho",
  error: "error",
};

// El worker solo recoge pasos en 'running'; ofrecemos "Ejecutar" cuando aún no lo está.
const RUNNABLE: StepStatus[] = ["pending", "needs_review", "error", "done"];

// Artefactos con visor interno propio (en vez de link externo).
const INTERNAL_VIEW: Record<string, string> = { copy: "copy", keyword_research: "keywords", wireframe: "wireframes", figma: "figma" };

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export function StepBoard({
  projectId,
  states,
  artifacts,
}: {
  projectId: string;
  states: StepState[];
  artifacts: Artifact[];
}) {
  const stateByStep = new Map(states.map((s) => [s.step, s]));
  const artifactsByStep = new Map<number, Artifact[]>();
  for (const a of artifacts) {
    const arr = artifactsByStep.get(a.step) ?? [];
    arr.push(a);
    artifactsByStep.set(a.step, arr);
  }

  return (
    <div className="ops-rows">
      {PIPELINE_STEPS.map((def) => {
        const st = stateByStep.get(def.step);
        const status: StepStatus = (st?.status as StepStatus) ?? "pending";
        const arts = artifactsByStep.get(def.step) ?? [];
        return (
          <div className={`ops-row ${status}`} key={def.step}>
            <span className={`ops-ind ${status}`}>{status === "done" ? <Check /> : null}</span>
            <div className="ops-mid">
              <div className="ops-name">
                {def.title}
                {!def.automated && <span className="ops-manual">manual</span>}
              </div>
              <div className="ops-log">{st?.logs || def.desc}</div>
              {arts.length > 0 && (
                <div className="ops-chips">
                  {arts.map((a) =>
                    INTERNAL_VIEW[a.type] ? (
                      <a
                        key={a.id}
                        href={`/projects/${projectId}/${INTERNAL_VIEW[a.type]}${a.type === "figma" ? `?step=${a.step}` : ""}`}
                      >
                        {a.label} →
                      </a>
                    ) : a.url ? (
                      <a key={a.id} href={a.url} target="_blank" rel="noreferrer">{a.label} ↗</a>
                    ) : (
                      <span key={a.id} className="ops-log">{a.label}</span>
                    )
                  )}
                </div>
              )}
              {def.step === 4 && (
                <form action={saveFigmaLink} className="ops-approve">
                  <input type="hidden" name="projectId" value={projectId} />
                  <input name="url" type="url" placeholder="Link del Figma capturado…" />
                  <button className="ops-btn" type="submit">
                    {status === "done" ? "Actualizar →" : "Guardar →"}
                  </button>
                </form>
              )}
              {def.step === 5 && (
                <form action={approveHifi} className="ops-approve">
                  <input type="hidden" name="projectId" value={projectId} />
                  <input name="url" type="url" placeholder="Link del Figma hi-fi aprobado…" />
                  <button className="ops-btn" type="submit">Aprobar →</button>
                </form>
              )}
            </div>
            <div className="ops-right">
              <span className={`ops-pill ${status}`}>{STATUS_LABEL[status]}</span>
              {def.step !== 5 && def.step !== 4 && def.automated && RUNNABLE.includes(status) && (
                <form action={enqueueStep}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="step" value={def.step} />
                  <button className="ops-btn" type="submit">
                    {status === "done" ? "Re-ejecutar" : "Ejecutar"}
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
