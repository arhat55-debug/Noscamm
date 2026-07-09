"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? "inline-flex w-full items-center justify-center rounded-[24px] bg-gold px-5 py-3 text-sm font-black text-black shadow-lg shadow-gold/20 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-white/20 disabled:cursor-not-allowed disabled:opacity-60"}
    >
      {pending ? "Processing..." : children}
    </button>
  );
}
