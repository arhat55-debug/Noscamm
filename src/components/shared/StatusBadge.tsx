const styles: Record<string, string> = {
  ACTIVE: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  SOLD: "border-zinc-400/30 bg-zinc-400/10 text-zinc-200",
  PENDING: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  PENDING_PAYMENT: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  WAITING_ADMIN_REVIEW: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  PAYMENT_CONFIRMED: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  MODERATOR_ASSIGNED: "border-purple-400/30 bg-purple-400/10 text-purple-100",
  ACCOUNT_TRANSFER: "border-blue-400/30 bg-blue-400/10 text-blue-100",
  BUYER_CONFIRM_PENDING: "border-orange-400/30 bg-orange-400/10 text-orange-100",
  COMPLETED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  APPROVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  REJECTED: "border-red-400/30 bg-red-400/10 text-red-100",
  DECLINED: "border-red-400/30 bg-red-400/10 text-red-100",
  DISPUTE: "border-red-400/30 bg-red-400/10 text-red-100",
  REFUNDED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
  CANCELLED: "border-zinc-400/30 bg-zinc-400/10 text-zinc-200",
  EXPIRED: "border-zinc-400/30 bg-zinc-400/10 text-zinc-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles[status] ?? "border-white/10 bg-white/5 text-zinc-200"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
