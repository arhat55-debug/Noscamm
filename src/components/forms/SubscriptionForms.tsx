"use client";

import { useActionState } from "react";
import { createSubscriptionOrder, uploadSubscriptionProof, type ActionState } from "@/lib/marketplace/actions";
import { SubmitButton } from "@/components/shared/SubmitButton";
import type { SubscriptionPlan } from "@/lib/marketplace/types";
import { formatMnt } from "@/components/marketplace/ListingCard";

const initialState: ActionState = { ok: false, message: "" };

function Message({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <p className={`rounded-2xl border p-3 text-sm ${state.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-red-400/30 bg-red-400/10 text-red-100"}`}>{state.message}</p>;
}

export function SubscriptionOrderForm({ plans }: { plans: SubscriptionPlan[] }) {
  const [state, action] = useActionState(createSubscriptionOrder, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <label key={plan.id} className="cursor-pointer rounded-3xl border border-white/10 bg-black/40 p-5 transition hover:border-gold/50">
            <input className="sr-only peer" type="radio" name="plan_type" value={plan.plan_type} required />
            <div className="peer-checked:text-gold">
              <p className="text-xl font-black text-white">{plan.name}</p>
              <p className="mt-2 text-3xl font-black text-gold">{formatMnt(plan.amount)}</p>
              <p className="mt-1 text-sm text-zinc-500">{plan.duration_days} days</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                {(plan.benefits ?? []).map((benefit) => <li key={benefit}>✓ {benefit}</li>)}
              </ul>
            </div>
          </label>
        ))}
      </div>
      <Message state={state} />
      <SubmitButton>Create bank-transfer order</SubmitButton>
    </form>
  );
}

export function SubscriptionProofForm() {
  const [state, action] = useActionState(uploadSubscriptionProof, initialState);

  return (
    <form action={action} className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-5">
      <h3 className="text-xl font-black text-white">Upload payment proof</h3>
      <input name="order_id" placeholder="Subscription order ID" className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold" required />
      <input name="payment_proof" type="file" accept="image/*" className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold" required />
      <Message state={state} />
      <SubmitButton>Submit proof for admin review</SubmitButton>
    </form>
  );
}
