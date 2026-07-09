import Link from "next/link";

export function EmptyState({
  title,
  message,
  actionHref,
  actionLabel,
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl shadow-black/20">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-gold/10 text-2xl">◇</div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-400">{message}</p>
      {actionHref && actionLabel ? (
        <Link className="mt-6 inline-flex rounded-full bg-gold px-5 py-3 text-sm font-bold text-black transition hover:bg-white" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
