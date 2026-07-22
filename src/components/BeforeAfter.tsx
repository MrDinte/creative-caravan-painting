"use client";

import { useId, useState } from "react";
import { VanArt } from "./VanArt";
import type { GalleryItem } from "@/lib/types";

// Draggable before/after comparison. Uses a range input so it works with
// touch, mouse and keyboard out of the box.
export function BeforeAfter({ item }: { item: GalleryItem }) {
  const [pos, setPos] = useState(50);
  const id = useId();

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200">
        <VanArt
          {...item.after}
          className="w-full h-auto"
          label={`${item.title} — after`}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${pos}%` }}
          aria-hidden
        >
          <div className="h-full" style={{ width: `${10000 / pos}%` }}>
            <VanArt {...item.before} className="w-full h-auto" />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-1 bg-white shadow-lg"
          style={{ left: `${pos}%` }}
          aria-hidden
        />
        <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Before
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-brand-solid px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          After
        </span>
      </div>

      <label htmlFor={id} className="sr-only">
        Reveal before and after for {item.title}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="mt-4 w-full accent-[var(--brand-solid)]"
        aria-label={`Reveal before and after for ${item.title}`}
      />
    </div>
  );
}
