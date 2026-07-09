import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl place-items-center px-4 py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Account recovery</p>
        <h1 className="mt-3 text-3xl font-black text-white">Reset password</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">Supabase will email a secure reset link if the account exists.</p>
        <div className="mt-6"><ResetPasswordForm /></div>
        <p className="mt-6 text-center text-sm text-zinc-400"><Link className="font-bold text-gold" href="/auth/login">Back to login</Link></p>
      </section>
    </main>
  );
}
