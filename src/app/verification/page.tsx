import { LivenessCapture } from "@/components/forms/LivenessCapture";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { requireUser } from "@/lib/auth/session";
import { submitVerificationForm } from "@/lib/marketplace/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller verification" };

const input = "rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold";

export default async function VerificationPage() {
  const { profile } = await requireUser();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Manual KYC</p>
        <h1 className="mt-3 text-4xl font-black text-white">Seller verification</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">National ID front/back and selfie or video evidence are uploaded as private Cloudinary assets. Face must be visible: no mask, sunglasses, filters, or obstruction. Approval is always manual.</p>
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-300">Current role: <strong className="text-gold">{profile?.role ?? "USER"}</strong></div>
        <form action={submitVerificationForm} className="mt-8 space-y-5">
          <LivenessCapture />
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-bold text-zinc-300">National ID front<input className={input} name="id_front" type="file" accept="image/*" required /></label>
            <label className="space-y-2 text-sm font-bold text-zinc-300">National ID back<input className={input} name="id_back" type="file" accept="image/*" required /></label>
            <label className="space-y-2 text-sm font-bold text-zinc-300">Selfie / video<input className={input} name="selfie_video" type="file" accept="image/*,video/*" required /></label>
          </div>
          <SubmitButton>Submit for manual review</SubmitButton>
        </form>
      </section>
    </main>
  );
}
