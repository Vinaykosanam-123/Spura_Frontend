'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-24 text-center">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {error.message || 'An unexpected error occurred.'}
          {error.digest && ` (ref ${error.digest})`}
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-stone-950 font-semibold transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
