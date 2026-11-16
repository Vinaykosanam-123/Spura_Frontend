'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Batch, Enrollment, User } from '@/lib/types';
import { formatDate } from '@/lib/format';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

function EnrollInner() {
  const sp = useSearchParams();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [batchId, setBatchId] = useState(sp.get('batchId') ?? '');
  const [userId, setUserId] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [bRes, uRes, eRes] = await Promise.all([
        api.adminBatches().catch(() => ({ batches: [] as Batch[] })),
        api.adminUsers().catch(() => ({ users: [] as User[] })),
        api.adminEnrollments({
          ...(batchId ? { batchId } : {}),
          ...(stateFilter ? { state: stateFilter } : {}),
        }),
      ]);
      setBatches(bRes.batches ?? []);
      setUsers(uRes.users ?? []);
      setEnrollments(eRes.enrollments ?? []);
      if (!batchId && bRes.batches?.length) {
        setBatchId(bRes.batches[0].id);
      }
      if (!userId && uRes.users?.length) {
        setUserId(uRes.users[0].id);
      }
    } catch {
      // ignore
    }
  }, [batchId, stateFilter, userId]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.adminBatches().catch(() => ({ batches: [] as Batch[] })),
      api.adminUsers().catch(() => ({ users: [] as User[] })),
      api.adminEnrollments({
        ...(batchId ? { batchId } : {}),
        ...(stateFilter ? { state: stateFilter } : {}),
      }),
    ])
      .then(([bRes, uRes, eRes]) => {
        if (!active) return;
        setBatches(bRes.batches ?? []);
        setUsers(uRes.users ?? []);
        setEnrollments(eRes.enrollments ?? []);
        if (!batchId && bRes.batches?.length) {
          setBatchId(bRes.batches[0].id);
        }
        if (uRes.users?.length) {
          setUserId((prev) => prev || uRes.users[0].id);
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      active = false;
    };
  }, [batchId, stateFilter]);

  const enroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const { enrollment } = await api.enrollUser(batchId, { userId, state: 'active' });
      setOk(`201 enrolled: ${enrollment.id} (state ${enrollment.state})`);
      setUserId('');
      await load();
    } catch (e: unknown) {
      setError(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  const updateState = async (
    enrollmentId: string,
    nextState: 'pending' | 'active' | 'cancelled' | 'completed',
  ) => {
    setError('');
    setOk('');
    try {
      await api.updateEnrollment(enrollmentId, { state: nextState });
      setOk(`Updated enrollment ${enrollmentId} to ${nextState}`);
      await load();
    } catch (e: unknown) {
      setError(apiErr(e));
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
        ← Studio
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">
        Enrollments
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminForm title="Enroll student (manual, no checkout)" error={error} ok={ok} busy={busy} submitLabel="Enroll" onSubmit={enroll}>
          <Field label="Batch ID" htmlFor="batch">
            {batches.length > 0 ? (
              <select id="batch" value={batchId} onChange={(e) => setBatchId(e.target.value)} className={inputCls}>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name} ({b.id.slice(0, 8)}…)
                  </option>
                ))}
              </select>
            ) : (
              <input id="batch" required value={batchId} onChange={(e) => setBatchId(e.target.value)} className={inputCls} placeholder="batch uuid from Batches tab" />
            )}
          </Field>
          <Field label="Student User" htmlFor="user">
            {users.length > 0 ? (
              <select id="user" value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} — {u.email} ({u.id.slice(0, 8)}…)
                  </option>
                ))}
              </select>
            ) : (
              <input id="user" required value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls} placeholder="user uuid from Users tab or /auth/me" />
            )}
          </Field>
          <p className="text-xs text-stone-500">State is set to <code>active</code> (2-year access from activation).</p>
        </AdminForm>

        <section className="card-calm rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">
              Batch enrollments ({enrollments.length})
            </h2>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              aria-label="Filter by state"
              className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-white/10 bg-white dark:bg-[#06080B] text-xs"
            >
              <option value="">All states</option>
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="cancelled">cancelled</option>
              <option value="completed">completed</option>
            </select>
          </div>
          {enrollments.length === 0 ? (
            <p className="text-sm text-stone-500">No enrollments match the current filter.</p>
          ) : (
            <ul className="space-y-2.5 max-h-[520px] overflow-auto">
              {enrollments.map((enr) => (
                <li
                  key={enr.id}
                  className="border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 text-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                      {enr.fullName ?? enr.userId} {enr.email ? `(${enr.email})` : ''}
                    </p>
                    <p className="text-xs text-stone-500">
                      {enr.batchCode ?? enr.batchId} · Expires {formatDate(enr.accessExpiresAt)}
                    </p>
                    <p className="text-xs text-stone-400 font-mono">{enr.id}</p>
                  </div>
                  <select
                    value={enr.state}
                    onChange={(e) =>
                      updateState(
                        enr.id,
                        e.target.value as 'pending' | 'active' | 'cancelled' | 'completed',
                      )
                    }
                    aria-label={`State for enrollment ${enr.id}`}
                    className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                  >
                    <option value="active">active</option>
                    <option value="pending">pending</option>
                    <option value="cancelled">cancelled</option>
                    <option value="completed">completed</option>
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AdminEnrollments() {
  return (
    <Guard requireAdmin allowInstructor={false}>
      <Suspense fallback={<main className="max-w-3xl mx-auto px-4 py-12">Loading…</main>}>
        <EnrollInner />
      </Suspense>
    </Guard>
  );
}
