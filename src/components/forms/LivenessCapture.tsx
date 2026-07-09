"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const steps = ["Look at camera", "Turn head left", "Turn head right", "Look up", "Look down", "Blink"];

export function LivenessCapture() {
  const [completed, setCompleted] = useState<string[]>([]);
  const evidence = useMemo(
    () => ({
      completed_steps: completed,
      completed_at: completed.length === steps.length ? new Date().toISOString() : null,
      disclaimer: "Manual review required. Interface records user-confirmed liveness steps only.",
    }),
    [completed],
  );

  return (
    <div className="rounded-3xl border border-gold/20 bg-black/50 p-5">
      <input type="hidden" name="liveness_evidence" value={JSON.stringify(evidence)} />
      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
        <div className="relative grid min-h-72 place-items-center overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_center,#2d2109,transparent_60%)]">
          <motion.div animate={{ scale: [1, 1.04, 1], opacity: [0.75, 1, 0.75] }} transition={{ repeat: Infinity, duration: 2 }} className="grid size-36 place-items-center rounded-full border border-gold/40 bg-gold/10 text-center text-sm font-bold text-gold">
            Face visible
            <br />no filters
          </motion.div>
        </div>
        <div>
          <p className="text-sm leading-6 text-zinc-400">Complete every liveness prompt, then upload a clear selfie or short video. NEXUS never auto-approves KYC; moderators review your evidence manually.</p>
          <div className="mt-5 grid gap-2">
            {steps.map((step) => {
              const done = completed.includes(step);
              return (
                <button
                  type="button"
                  key={step}
                  onClick={() => setCompleted((items) => (items.includes(step) ? items.filter((item) => item !== step) : [...items, step]))}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${done ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-gold/50"}`}
                >
                  {done ? "✓ " : "○ "}{step}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
