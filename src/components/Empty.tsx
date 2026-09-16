export default function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
      <svg
        className="mx-auto h-12 w-12 text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="mt-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
      {hint && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}
