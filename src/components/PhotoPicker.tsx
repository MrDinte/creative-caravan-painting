"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";
import { MAX_PHOTO_BYTES } from "@/lib/blob";

export interface UploadedPhoto {
  url: string;
  name: string;
}

/**
 * Uploads straight from the browser to Vercel Blob, so phone photos aren't
 * capped by the 4.5 MB server-action body limit. The resulting URLs are
 * submitted with the surrounding form.
 */
export function PhotoPicker({
  photos,
  onChange,
  enabled,
}: {
  photos: UploadedPhoto[];
  onChange: (next: UploadedPhoto[]) => void;
  enabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!enabled) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Photo uploads are off.</strong> Create a Blob store in the
        Vercel dashboard (Storage → Create Database → Blob) to switch them on.
      </p>
    );
  }

  async function handleFiles(files: FileList) {
    setError("");
    setBusy(true);
    const added: UploadedPhoto[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_PHOTO_BYTES) {
          setError(`${file.name} is over 15 MB — please pick a smaller photo.`);
          continue;
        }
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
        });
        added.push({ url: blob.url, name: file.name });
      }
      if (added.length) onChange([...photos, ...added]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Upload failed. Please try again."
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-800">
          Photos
        </span>
        {/* accept="image/*" lets a phone offer both camera and library. */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          data-testid="photo-input"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:min-h-[44px] file:cursor-pointer file:rounded-full file:border-0 file:bg-brand file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
        />
      </label>
      <p className="mt-1 text-xs text-slate-500">
        Take a photo or choose from your gallery. JPG, PNG or WebP up to 15 MB.
      </p>

      {busy && (
        <p role="status" className="mt-2 text-sm font-medium text-brand">
          Uploading…
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {photos.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3" data-testid="photo-previews">
          {photos.map((p) => (
            <li key={p.url} className="relative">
              {/* Blob host is remote and arbitrary; a plain img avoids
                  configuring next/image remote patterns for it. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.name}
                className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(photos.filter((x) => x.url !== p.url))}
                aria-label={`Remove ${p.name}`}
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-xs font-bold text-white"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
