import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="text-center">
        <p className="font-display text-6xl font-bold text-brand">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-slate-600">
          It might have moved, or the link might be out of date.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-dark"
          >
            Back to home
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-slate-300 px-6 font-semibold text-slate-800 hover:border-brand hover:text-brand"
          >
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
