import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getAuthContext } from "@/lib/auth/session";
import { signOut } from "@/lib/marketplace/actions";

const nav = [
  { href: "/listings", label: "Listings" },
  { href: "/sell", label: "Sell" },
  { href: "/verification", label: "Verify" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/trades", label: "Trades" },
];

export async function Header() {
  const { profile } = await getAuthContext();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl border border-gold/40 bg-gold/10 text-gold shadow-lg shadow-gold/10">
            <ShieldCheck size={20} />
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.22em] text-white">NEXUS</span>
            <span className="block text-[11px] uppercase tracking-[0.14em] text-gold">MLBB Marketplace</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white">
              {item.label}
            </Link>
          ))}
          {profile?.role === "MODERATOR" || profile?.role === "ADMIN" ? (
            <Link href="/moderator" className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white">
              Moderator
            </Link>
          ) : null}
          {profile?.role === "ADMIN" ? (
            <Link href="/admin" className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white">
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {profile ? (
            <>
              <Link href="/dashboard" className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white sm:inline-flex">
                {profile.username ?? "Dashboard"}
              </Link>
              <form action={signOut}>
                <button className="rounded-full bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-gold">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">
                Log in
              </Link>
              <Link href="/auth/signup" className="rounded-full bg-gold px-4 py-2 text-sm font-black text-black transition hover:bg-white">
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
