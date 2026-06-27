"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      domain: emptyToNull(formData.get("domain")),
      briefing_doc_urls: lines(formData.get("briefing_doc_urls")),
      structure_sheet_urls: lines(formData.get("structure_sheet_urls")),
      relume_urls: lines(formData.get("relume_urls")),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v || "").trim();
  return s.length ? s : null;
}

// Textarea con un link por línea → array de URLs (sin vacíos).
function lines(v: FormDataEntryValue | null): string[] {
  return String(v || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
