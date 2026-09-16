import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-24 text-center">
      <div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">404</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          This page doesn&apos;t exist or isn&apos;t available.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full bg-zinc-900 px-5 text-white dark:bg-white dark:text-zinc-900 font-medium"
          >
            Home
          </Link>
          <Link
            href="/catalog"
            className="inline-flex h-11 items-center rounded-full border border-zinc-300 dark:border-zinc-700 px-5 font-medium"
          >
            Catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
