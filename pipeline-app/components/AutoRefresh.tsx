"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mientras haya un paso en curso, re-pide los datos del server component
// cada 3 s para reflejar running → done sin recargar a mano. Para solo cuando
// `active` es false (ningún paso corriendo).
// ponytail: polling simple; pasar a Supabase Realtime si el ruido importa.
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(id);
  }, [active, router]);
  return null;
}
