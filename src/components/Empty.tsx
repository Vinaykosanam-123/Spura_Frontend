import Link from 'next/link';

export default function Empty({
  title,
  hint,
  cta,
}: {
  title: string;
  hint?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="text-center py-12 border border-dashed border-stone-300 dark:border-white/10 rounded-xl bg-transparent">
      <svg
        className="mx-auto h-12 w-12 text-stone-400"
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
      <h3 className="mt-2 text-lg font-medium text-stone-900 dark:text-stone-100">{title}</h3>
      {hint && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{hint}</p>}
      {cta && (
        <div className="mt-4">
          <Link
            href={cta.href}
            className="inline-flex h-9 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-4 text-xs font-semibold text-stone-950 transition-colors"
          >
            {cta.label}
          </Link>
        </div>
      )}
    </div>
  );
}
