import Link from "next/link";
import { signOut } from "@/app/projects/actions";

export function TopNav({ email }: { email?: string | null }) {
  return (
    <nav className="topnav">
      <Link href="/projects" className="brand" aria-label="omíbu · Pipeline" style={{ display: "inline-flex", textDecoration: "none" }}>
        <img src="/logo-omibu.png" alt="omíbu" style={{ height: 30, width: "auto", display: "block" }} />
      </Link>
      <span className="spacer" />
      {email && <span className="user">{email}</span>}
      <form action={signOut}>
        <button className="btn ghost" type="submit">Salir</button>
      </form>
    </nav>
  );
}
