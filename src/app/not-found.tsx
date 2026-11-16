import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-24 text-center">
      <div>
        <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-100">404</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          This page doesn&apos;t exist or isn&apos;t available.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-stone-950 font-semibold transition-colors"
          >
            Home
          </Link>
          <Link
            href="/courses"
            className="inline-flex h-11 items-center rounded-xl border border-stone-300 dark:border-white/10 hover:bg-white/5 px-5 font-medium"
          >
            Catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
