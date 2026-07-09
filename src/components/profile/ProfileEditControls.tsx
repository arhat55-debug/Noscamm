"use client";

import { useState } from "react";
import { Camera, Landmark } from "lucide-react";
import { SubmitButton } from "@/components/shared/SubmitButton";

type ProfileAction = (formData: FormData) => void | Promise<void>;

export function ProfileEditControls({
  action,
  bankAccount,
}: {
  action: ProfileAction;
  bankAccount: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-auto">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:border-gold/50 hover:text-gold"
      >
        <Camera size={14} /> Профайл засах
      </button>

      {open ? (
        <div className="mt-3 grid gap-3 rounded-[20px] border border-white/10 bg-black/70 p-4 backdrop-blur-xl sm:grid-cols-2">
          <form action={action} className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-zinc-300">
              <Camera size={14} className="text-gold" /> Профайл зураг
            </label>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              required
              className="w-full text-xs text-zinc-400 file:mr-2 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-zinc-200"
            />
            <SubmitButton className="w-full rounded-full bg-gold px-4 py-2 text-xs font-black text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">
              Зураг солих
            </SubmitButton>
          </form>

          <form action={action} className="space-y-2">
            <label htmlFor="bank_account" className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-zinc-300">
              <Landmark size={14} className="text-gold" /> Дансны дугаар
            </label>
            <input
              id="bank_account"
              type="text"
              name="bank_account"
              maxLength={64}
              defaultValue={bankAccount ?? ""}
              placeholder="Жишээ: Хаан банк 5001234567"
              className="w-full rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-gold/50"
            />
            <SubmitButton className="w-full rounded-full border border-gold/40 px-4 py-2 text-xs font-black text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-60">
              Холбох
            </SubmitButton>
            <p className="text-[11px] text-zinc-500">Энэ дансны дугаар зарын дэлгэрэнгүй хуудсанд худалдан авагчид харагдана.</p>
          </form>
        </div>
      ) : null}
    </div>
  );
}
