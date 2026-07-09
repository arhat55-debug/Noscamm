export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-pulse overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04]">
        <div className="aspect-[16/9] max-h-[460px] min-h-[260px] bg-white/[0.06]" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.05]" />)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="h-[620px] animate-pulse rounded-[24px] border border-white/10 bg-white/[0.04]" />
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.04]" />
          <div className="h-72 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.04]" />
        </div>
      </div>
    </main>
  );
}
