"use client";

import { useActionState } from "react";
import { signInWithGoogle, signInWithPassword, signUpWithPassword, sendPasswordReset, type ActionState } from "@/lib/marketplace/actions";
import { SubmitButton } from "@/components/shared/SubmitButton";

const initialState: ActionState = { ok: false, message: "" };

function Message({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <p className={`rounded-2xl border p-3 text-sm ${state.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-red-400/30 bg-red-400/10 text-red-100"}`}>{state.message}</p>;
}

const inputClass = "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-gold";

export function LoginForm() {
  const [state, action] = useActionState(signInWithPassword, initialState);

  return (
    <div className="space-y-4">
      <form action={signInWithGoogle}>
        <button className="w-full rounded-2xl border border-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/10">Continue with Google</button>
      </form>
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-zinc-600"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
      <form action={action} className="space-y-4">
        <input className={inputClass} name="email" type="email" placeholder="Email" required />
        <input className={inputClass} name="password" type="password" placeholder="Password" required />
        <Message state={state} />
        <SubmitButton>Log in securely</SubmitButton>
      </form>
    </div>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signUpWithPassword, initialState);

  return (
    <form action={action} className="space-y-4">
      <input className={inputClass} name="username" placeholder="Username" required />
      <input className={inputClass} name="email" type="email" placeholder="Email" required />
      <input className={inputClass} name="password" type="password" placeholder="Password (8+ characters)" required />
      <Message state={state} />
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(sendPasswordReset, initialState);

  return (
    <form action={action} className="space-y-4">
      <input className={inputClass} name="email" type="email" placeholder="Email" required />
      <Message state={state} />
      <SubmitButton>Send reset email</SubmitButton>
    </form>
  );
}
