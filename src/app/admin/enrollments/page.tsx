'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

function EnrollInner() {
  const sp = useSearchParams();
  const [batchId, setBatchId] = useState(sp.get('batchId') ?? '');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const enroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const { enrollment } = await api.enrollUser(batchId, { userId, state: 'active' });
      setOk(`201 enrolled: ${enrollment.id} (state ${enrollment.state})`);
      setUserId('');
    } catch (e: unknown) {
      setError(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
        ← Studio
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Enrollments</h1>
      <AdminForm title="Enroll student (manual, no checkout)" error={error} ok={ok} busy={busy} submitLabel="Enroll" onSubmit={enroll}>
        <Field label="Batch ID" htmlFor="batch">
          <input id="batch" required value={batchId} onChange={(e) => setBatchId(e.target.value)} className={inputCls} placeholder="batch uuid from Batches tab" />
        </Field>
        <Field label="User ID" htmlFor="user">
          <input id="user" required value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls} placeholder="user uuid from /auth/me" />
        </Field>
        <p className="text-xs text-zinc-500">State is always <code>active</code> (2-year access from activation).</p>
      </AdminForm>
    </main>
  );
}

export default function AdminEnrollments() {
  return (
    <Guard requireAdmin>
      <Suspense fallback={<main className="max-w-3xl mx-auto px-4 py-12">Loading…</main>}>
        <EnrollInner />
      </Suspense>
    </Guard>
  );
}
