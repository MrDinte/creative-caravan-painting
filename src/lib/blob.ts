// Photo storage via Vercel Blob.
//
// To switch on: Vercel project → Storage → Create Database → Blob. That
// provisions BLOB_READ_WRITE_TOKEN automatically. Until then the upload UI
// explains it is unavailable rather than failing on submit.

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

/** Photos come straight off a phone, so allow generous headroom. */
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
