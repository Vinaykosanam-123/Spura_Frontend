'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

type Contest = {
  id: string; title: string; difficulty: string; durationMinutes: number;
  startsAt: string; endsAt: string; state: string; total: number;
  companyName: string | null;
};

export default function AdminContests() {
  const [title, setTitle] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [difficulty, setDifficulty] = useState('mixed');
  const [duration, setDuration] = useState('60');
  const [count, setCount] = useState('5');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Contest[]>([]);

  const load = useCallback(async () => {
    try {
      const { contests } = await api.adminContests();
      setList(contests ?? []);
    } catch (e: unknown) {
      setError(apiErr(e));
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.adminContests()
      .then(({ contests }) => {
        if (active) setList(contests ?? []);
      })
      .catch((e: unknown) => {
        if (active) setError(apiErr(e));
      });
    return () => {
      active = false;
    };
  }, []);

  const remove = async (id: string) => {
    setError('');
    setOk('');
    try {
      await api.deleteContest(id);
      setOk('Contest deleted');
      await load();
    } catch (e: unknown) {
      setError(apiErr(e));
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const data = await api.createContest({
        title,
        ...(companySlug.trim() ? { companySlug: companySlug.trim().toLowerCase() } : {}),
        difficulty,
        durationMinutes: Number(duration),
        questionCount: Number(count),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      });
      setOk(`201 contest created · ${data.picked} questions picked`);
      setTitle('');
      await load();
    } catch (e: unknown) {
      setError(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Guard requireAdmin allowInstructor={false}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">Contests</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminForm title="Create contest" error={error} ok={ok} busy={busy} submitLabel="Create" onSubmit={create}>
            <Field label="Title" htmlFor="ct">
              <input id="ct" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company slug (optional)" htmlFor="cc">
                <input id="cc" value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} placeholder="tcs" className={inputCls} />
              </Field>
              <Field label="Difficulty" htmlFor="cd">
                <select id="cd" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputCls}>
                  <option value="mixed">mixed</option>
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration (min)" htmlFor="cdu">
                <input id="cdu" type="number" min={5} max={180} required value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Questions (1–20)" htmlFor="cq">
                <input id="cq" type="number" min={1} max={20} required value={count} onChange={(e) => setCount(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts at" htmlFor="cs">
                <input id="cs" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Ends at" htmlFor="ce">
                <input id="ce" type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <p className="text-xs text-stone-500">Questions auto-picked by company frequency. State derives from times.</p>
          </AdminForm>
          <section className="card-calm rounded-2xl p-6 h-fit">
            <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">All contests</h2>
            {list.length === 0 ? (
              <p className="text-sm text-stone-500">None yet.</p>
            ) : (
              <ul className="space-y-3">
                {list.map((c) => (
                  <li key={c.id} className="text-sm flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {c.title} <span className="ml-1 text-xs font-normal text-stone-500">[{c.state}]</span>
                      </p>
                      <p className="text-stone-500 text-xs">
                        {c.companyName ?? 'Mixed'} · {c.difficulty} · {c.total} Qs · {c.durationMinutes} min
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="text-xs text-red-600 hover:underline shrink-0"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </Guard>
  );
}
