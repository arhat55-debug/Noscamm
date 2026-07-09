import Link from "next/link";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { canSell, requireUser } from "@/lib/auth/session";
import { createListingForm } from "@/lib/marketplace/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create listing" };

const input = "rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold";

export default async function SellPage() {
  const { profile } = await requireUser();

  if (!canSell(profile?.role)) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-gold/20 bg-white/[0.04] p-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Verification required</p>
          <h1 className="mt-3 text-4xl font-black text-white">Only verified sellers can create listings</h1>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">Submit national ID and liveness evidence. A moderator or admin will manually review it before selling is enabled.</p>
          <Link href="/verification" className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 font-black text-black hover:bg-white">Request verification</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">Seller desk</p>
        <h1 className="mt-3 text-4xl font-black text-white">Create MLBB account listing</h1>
        <p className="mt-3 text-sm text-zinc-400">Upload JPG, PNG, or WEBP screenshots. Cloudinary crops every image to a premium 4:3 gallery format and creates optimized thumbnails. Free sellers can upload 5 images; Seller Pro can upload 10.</p>
        <form action={createListingForm} className="mt-8 grid gap-4">
          <input className={input} name="title" placeholder="Listing title" required />
          <div className="grid gap-4 md:grid-cols-2">
            <input className={input} name="price" type="number" min="1" placeholder="Price (MNT)" required />
            <input className={input} name="rank" placeholder="Rank" required />
            <input className={input} name="server_id" placeholder="Server ID" required />
            <input className={input} name="heroes" type="number" min="0" placeholder="Hero count" required />
            <input className={input} name="skins" type="number" min="0" placeholder="Skin count" required />
            <input className={input} name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
          </div>
          <textarea className={`${input} min-h-40`} name="description" placeholder="Describe account rank, notable skins, heroes, server, recovery status, and transfer notes." required />
          <SubmitButton>Publish listing</SubmitButton>
        </form>
      </section>
    </main>
  );
}
