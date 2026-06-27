"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Pone un paso en cola: el worker recoge los step_states en 'running'.
export async function enqueueStep(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const step = Number(formData.get("step"));
  if (!projectId || !Number.isInteger(step)) return;

  const supabase = createClient();
  const { error } = await supabase
    .from("step_states")
    .update({ status: "running", logs: "En cola…", updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("step", step);

  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

// Paso ⑤: gate humano. El diseñador pega el link del Figma hi-fi aprobado y se marca hecho.
export async function approveHifi(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const url = String(formData.get("url") || "").trim();
  const step = 5;
  if (!projectId || !/^https?:\/\//i.test(url)) return;

  const supabase = createClient();
  await supabase.from("artifacts").delete().eq("project_id", projectId).eq("step", step).eq("type", "figma");
  const { error } = await supabase
    .from("artifacts")
    .insert({ project_id: projectId, step, type: "figma", label: "Figma hi-fi (aprobado)", url });
  if (error) throw new Error(error.message);

  await supabase
    .from("step_states")
    .update({ status: "done", logs: "Hi-fi aprobado.", updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("step", step);
  revalidatePath(`/projects/${projectId}`);
}

// Paso ④: guarda el link del Figma resultante de la captura (operación manual de navegador por ahora).
export async function saveFigmaLink(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const url = String(formData.get("url") || "").trim();
  const step = 4;
  if (!projectId || !/^https?:\/\//i.test(url)) return;

  const supabase = createClient();
  await supabase.from("artifacts").delete().eq("project_id", projectId).eq("step", step).eq("type", "figma");
  const { error } = await supabase
    .from("artifacts")
    .insert({ project_id: projectId, step, type: "figma", label: "Abrir en Figma", url });
  if (error) throw new Error(error.message);

  await supabase
    .from("step_states")
    .update({ status: "done", logs: "Link de Figma guardado.", updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("step", step);
  revalidatePath(`/projects/${projectId}`);
}

// Borra el proyecto. Las FK de step_states y artifacts son ON DELETE CASCADE,
// así que se eliminan con él. Destructivo e irreversible.
export async function deleteProject(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  if (!projectId) return;

  const supabase = createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath("/projects");
  redirect("/projects");
}
