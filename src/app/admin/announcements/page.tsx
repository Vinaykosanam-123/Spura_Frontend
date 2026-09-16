'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Announcement } from '@/lib/types';
import { formatDate } from '@/lib/format';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

export default function AdminAnnouncements() {
  const [batchId, setBatchId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Announcement[]>([]);

  const load = useCallback(async () => {
    try {
      const { announcements } = await api.announcements();
      setList(announcements ?? []);
    } catch {
      setList([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      await api.createAnnouncement({
        batchId: batchId || undefined,
        title,
        body,
      });
      setOk('201 announcement published');
      setTitle('');
      setBody('');
      await load();
    } catch (e: unknown) {
      setError(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Guard requireAdmin>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Announcements</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminForm title="Publish announcement" error={error} ok={ok} busy={busy} submitLabel="Publish" onSubmit={create}>
            <Field label="Batch ID (optional — blank = all)" htmlFor="b">
              <input id="b" value={batchId} onChange={(e) => setBatchId(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Title" htmlFor="t">
              <input id="t" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Body" htmlFor="bo">
              <textarea id="bo" required value={body} onChange={(e) => setBody(e.target.value)} className={inputCls} rows={4} />
            </Field>
          </AdminForm>
          <section className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 bg-white dark:bg-zinc-900 h-fit">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Published</h2>
            {list.length === 0 ? (
              <p className="text-sm text-zinc-500">None visible.</p>
            ) : (
              <ul className="space-y-3">
                {list.map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{a.title}</p>
                    <p className="text-zinc-500 text-xs">{formatDate(a.publishedAt)}</p>
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
