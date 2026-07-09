import Link from "next/link";
import { SignupForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl place-items-center px-4 py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Join marketplace</p>
        <h1 className="mt-3 text-3xl font-black text-white">Create your NEXUS profile</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">Supabase Auth handles credentials securely. NEXUS never stores passwords.</p>
        <div className="mt-6"><SignupForm /></div>
        <p className="mt-6 text-center text-sm text-zinc-400">Already registered? <Link className="font-bold text-gold" href="/auth/login">Log in</Link></p>
      </section>
    </main>
  );
}
