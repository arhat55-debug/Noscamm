"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ListingImage } from "@/lib/marketplace/types";

export function PremiumGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const sortedImages = useMemo(() => [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)), [images]);
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const showPrevious = useCallback(() => setActive((index) => (index === 0 ? sortedImages.length - 1 : index - 1)), [sortedImages.length]);
  const showNext = useCallback(() => setActive((index) => (index >= sortedImages.length - 1 ? 0 : index + 1)), [sortedImages.length]);

  useEffect(() => {
    if (!fullscreen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFullscreen(false);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen, showNext, showPrevious]);

  if (!sortedImages.length) {
    return <div className="grid aspect-[4/3] place-items-center rounded-[24px] border border-white/10 bg-white/[0.04] text-zinc-500">No images</div>;
  }

  const activeImage = sortedImages[active];

  const viewer = (
    <div
      className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40"
      onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        if (touchStart === null) return;
        const delta = touchStart - (event.changedTouches[0]?.clientX ?? touchStart);
        if (Math.abs(delta) > 42) {
          if (delta > 0) showNext();
          else showPrevious();
        }
        setTouchStart(null);
      }}
    >
      <Image
        src={activeImage.image_url}
        alt={`${title} screenshot ${active + 1}`}
        fill
        sizes="(max-width:1024px) 100vw, 58vw"
        className="object-cover transition duration-700 hover:scale-105"
        priority={active === 0}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-4">
        <button type="button" onClick={showPrevious} className="grid size-11 place-items-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur transition hover:bg-gold hover:text-black">
          <ChevronLeft size={20} />
        </button>
        <button type="button" onClick={() => setFullscreen(true)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-gold hover:text-black">
          <Maximize2 size={16} /> Fullscreen
        </button>
        <button type="button" onClick={showNext} className="grid size-11 place-items-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur transition hover:bg-gold hover:text-black">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {viewer}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {sortedImages.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActive(index)}
            className={`group relative aspect-[4/3] overflow-hidden rounded-[18px] border bg-zinc-950 transition ${index === active ? "border-gold shadow-lg shadow-gold/20" : "border-white/10 hover:border-gold/50"}`}
          >
            <Image src={image.thumbnail_url ?? image.image_url} alt={`${title} thumbnail ${index + 1}`} fill sizes="180px" className="object-cover transition duration-500 group-hover:scale-110" loading="lazy" />
          </button>
        ))}
      </div>

      {fullscreen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4 backdrop-blur-xl" role="dialog" aria-modal="true">
          <button type="button" onClick={() => setFullscreen(false)} className="absolute right-4 top-4 grid size-12 place-items-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-gold hover:text-black">
            <X />
          </button>
          <div className="w-full max-w-6xl">{viewer}</div>
        </div>
      ) : null}
    </div>
  );
}
