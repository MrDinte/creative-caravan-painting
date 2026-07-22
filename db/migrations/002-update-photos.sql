-- Migration 002 — photos on job updates
--
--   psql "$DATABASE_URL" -f db/migrations/002-update-photos.sql
--   (or paste into the Neon SQL Editor)
--
-- Safe to run more than once. Photo files live in Vercel Blob; this column
-- stores the public URLs returned by the upload.

alter table job_updates
  add column if not exists photo_urls jsonb not null default '[]'::jsonb;
