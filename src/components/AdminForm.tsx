'use client';

export function Field({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  'w-full px-3 py-2 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#090C10] text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';

export function AdminForm({
  title,
  error,
  ok,
  busy,
  submitLabel,
  onSubmit,
  children,
}: {
  title: string;
  error?: string;
  ok?: string;
  busy?: boolean;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-stone-200 dark:border-white/10 rounded-xl p-5 bg-white dark:bg-[#0F1319]">
      <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{title}</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        {children}
        <button
          type="submit"
          disabled={busy}
          className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm disabled:opacity-50 transition-colors"
        >
          {busy ? 'Working…' : submitLabel}
        </button>
      </form>
      {error && (
        <p className="mt-3 p-2 text-sm rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="mt-3 p-2 text-sm rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" role="status">
          {ok}
        </p>
      )}
    </section>
  );
}

export function apiErr(e: unknown): string {
  const err = e as { status?: number; code?: string; message?: string; fields?: unknown };
  if (err?.status === 409) return `409 ${err.code ?? 'DUPLICATE'}`;
  if (err?.status === 400) {
    const f = err.fields ? ` — fields: ${JSON.stringify(err.fields)}` : '';
    return `400 ${err.code ?? 'VALIDATION'}${f}`;
  }
  if (err?.status === 404) return `404 ${err.code ?? 'NOT_FOUND'}`;
  return e instanceof Error ? e.message : 'Request failed';
}
