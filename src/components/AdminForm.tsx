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
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  'w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

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
    <section className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 bg-white dark:bg-zinc-900">
      <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{title}</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        {children}
        <button
          type="submit"
          disabled={busy}
          className="h-10 px-5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium text-sm disabled:opacity-50"
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
