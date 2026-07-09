import Link from "next/link";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Login" };

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl place-items-center px-4 py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Secure session</p>
        <h1 className="mt-3 text-3xl font-black text-white">Log in to NEXUS</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">Access private trade rooms, seller verification, and marketplace dashboards.</p>
        {searchParams?.error ? <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{searchParams.error}</p> : null}
        <div className="mt-6"><LoginForm /></div>
        <p className="mt-6 text-center text-sm text-zinc-400">No account? <Link className="font-bold text-gold" href="/auth/signup">Create one</Link></p>
        <p className="mt-3 text-center text-sm text-zinc-500"><Link href="/auth/reset-password" className="hover:text-gold">Forgot password?</Link></p>
      </section>
    </main>
  );
}
