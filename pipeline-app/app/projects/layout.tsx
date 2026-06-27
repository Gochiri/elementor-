import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/TopNav";
import { ProjectNav } from "@/components/ProjectNav";
import { PIPELINE_STEPS, pipelineStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: projects }, { data: steps }] = await Promise.all([
    supabase.from("projects").select("id,name").order("created_at", { ascending: false }),
    supabase.from("step_states").select("project_id,status"),
  ]);

  const total = PIPELINE_STEPS.length;
  const stepsByProject = new Map<string, string[]>();
  for (const s of (steps as { project_id: string; status: string }[] | null) ?? []) {
    const arr = stepsByProject.get(s.project_id) ?? [];
    arr.push(s.status);
    stepsByProject.set(s.project_id, arr);
  }

  const navProjects = ((projects as { id: string; name: string }[] | null) ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    status: pipelineStatus(stepsByProject.get(p.id) ?? [], total).status,
  }));

  return (
    <>
      <TopNav email={user?.email} />
      <div className="shell">
        <ProjectNav projects={navProjects} />
        <div className="shell-main">{children}</div>
      </div>
    </>
  );
}
