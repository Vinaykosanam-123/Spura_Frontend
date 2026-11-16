'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Batch, BatchInstructor, Course, User } from '@/lib/types';
import { formatDate, formatPrice } from '@/lib/format';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

export default function AdminBatches() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courseId, setCourseId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startAt, setStartAt] = useState('2026-10-01T04:30');
  const [endAt, setEndAt] = useState('2027-01-31T12:30');
  const [capacity, setCapacity] = useState('50');
  const [tuitionMinor, setTuitionMinor] = useState('0');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [instructors, setInstructors] = useState<BatchInstructor[]>([]);
  const [instructorUserId, setInstructorUserId] = useState('');
  const [instMsg, setInstMsg] = useState('');
  const [instErr, setInstErr] = useState('');

  const load = useCallback(async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        api.adminCourses(),
        api.adminBatches(),
      ]);
      setCourses(cRes.courses ?? []);
      setBatches(bRes.batches ?? []);
      if (cRes.courses?.length && !courseId) setCourseId(cRes.courses[0].id);
      if (bRes.batches?.length && !selectedBatchId) setSelectedBatchId(bRes.batches[0].id);
    } catch {
      // ignore
    }
  }, [courseId, selectedBatchId]);

  const loadInstructors = useCallback(async (bid: string) => {
    if (!bid) return;
    try {
      const { instructors } = await api.batchInstructors(bid);
      setInstructors(instructors ?? []);
    } catch {
      setInstructors([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.adminCourses(),
      api.adminBatches(),
      api.adminUsers().catch(() => ({ users: [] as User[] })),
    ])
      .then(([cRes, bRes, uRes]) => {
        if (!active) return;
        setCourses(cRes.courses ?? []);
        setBatches(bRes.batches ?? []);
        setUsers(uRes.users ?? []);
        if (cRes.courses?.length) setCourseId((prev) => prev || cRes.courses[0].id);
        if (bRes.batches?.length) setSelectedBatchId((prev) => prev || bRes.batches[0].id);
        if (uRes.users?.length) setInstructorUserId((prev) => prev || uRes.users[0].id);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedBatchId) return;
    let active = true;
    api.batchInstructors(selectedBatchId)
      .then(({ instructors }) => {
        if (active) setInstructors(instructors ?? []);
      })
      .catch(() => {
        if (active) setInstructors([]);
      });
    return () => {
      active = false;
    };
  }, [selectedBatchId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const { batch } = await api.createBatch({
        courseId,
        code,
        name,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        capacity: parseInt(capacity, 10),
        tuitionAmountMinor: parseInt(tuitionMinor || '0', 10),
        timezone: 'Asia/Kolkata',
        status: 'open',
      });
      setOk(`201 created batch ${batch.code} (${batch.id})`);
      setCode('');
      setName('');
      setSelectedBatchId(batch.id);
      await load();
    } catch (e: unknown) {
      setError(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (batchId: string, status: string) => {
    setError('');
    try {
      await api.updateBatch(batchId, { status });
      setOk(`Updated batch ${batchId} status to ${status}`);
      await load();
    } catch (e: unknown) {
      setError(apiErr(e));
    }
  };

  const assignInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !instructorUserId) return;
    setInstErr('');
    setInstMsg('');
    try {
      const { assignment } = await api.assignBatchInstructor(selectedBatchId, instructorUserId.trim());
      setInstMsg(`Assigned ${assignment.fullName} (${assignment.email})`);
      setInstructorUserId('');
      await loadInstructors(selectedBatchId);
    } catch (e: unknown) {
      setInstErr(apiErr(e));
    }
  };

  const removeInstructor = async (uid: string) => {
    setInstErr('');
    try {
      await api.removeBatchInstructor(selectedBatchId, uid);
      await loadInstructors(selectedBatchId);
    } catch (e: unknown) {
      setInstErr(apiErr(e));
    }
  };

  return (
    <Guard requireAdmin allowInstructor={false}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">
          Batches & Instructors
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <AdminForm title="Create batch" error={error} ok={ok} busy={busy} submitLabel="Create" onSubmit={create}>
              <Field label="Course" htmlFor="course">
                <select id="course" value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} ({c.slug})</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code" htmlFor="code">
                  <input id="code" required value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="DSA-2026-02" />
                </Field>
                <Field label="Name" htmlFor="name">
                  <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="DSA February 2026" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts at" htmlFor="start">
                  <input id="start" type="datetime-local" required value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Ends at" htmlFor="end">
                  <input id="end" type="datetime-local" required value={endAt} onChange={(e) => setEndAt(e.target.value)} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity" htmlFor="cap">
                  <input id="cap" type="number" min={1} required value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Tuition (minor units)" htmlFor="tuition">
                  <input id="tuition" type="number" min={0} required value={tuitionMinor} onChange={(e) => setTuitionMinor(e.target.value)} className={inputCls} />
                </Field>
              </div>
            </AdminForm>

            <AdminForm
              title="Assign batch instructor (mentor/admin user)"
              error={instErr}
              ok={instMsg}
              submitLabel="Assign instructor"
              onSubmit={assignInstructor}
            >
              <Field label="Batch" htmlFor="inst-batch">
                <select
                  id="inst-batch"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className={inputCls}
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Instructor User" htmlFor="inst-uid">
                {users.length > 0 ? (
                  <select
                    id="inst-uid"
                    value={instructorUserId}
                    onChange={(e) => setInstructorUserId(e.target.value)}
                    className={inputCls}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email}) [{u.roles.join(', ')}]
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="inst-uid"
                    required
                    value={instructorUserId}
                    onChange={(e) => setInstructorUserId(e.target.value)}
                    placeholder="UUID from Users tab"
                    className={inputCls}
                  />
                )}
              </Field>
              {instructors.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                    Assigned instructors ({instructors.length})
                  </p>
                  <ul className="space-y-1.5">
                    {instructors.map((inst) => {
                      const uid = inst.userId ?? inst.id ?? '';
                      return (
                        <li key={uid} className="flex items-center justify-between text-xs bg-stone-50 dark:bg-stone-800 px-3 py-2 rounded-lg">
                          <span>
                            {inst.fullName} ({inst.email})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeInstructor(uid)}
                            className="text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </AdminForm>
          </div>

          <section className="card-calm rounded-2xl p-6 h-fit">
            <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">
              All batches ({batches.length})
            </h2>
            {batches.length === 0 ? (
              <p className="text-sm text-stone-500">No batches yet.</p>
            ) : (
              <ul className="space-y-3">
                {batches.map((b) => (
                  <li key={b.id} className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-stone-100">
                          {b.code} · {b.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {b.courseTitle} · {formatDate(b.startAt)} → {formatDate(b.endAt)} ·{' '}
                          {formatPrice(b.tuitionAmountMinor, b.currency)}
                        </p>
                        <p className="text-xs text-stone-500">
                          Seats: {b.reservedSeats}/{b.capacity} ({b.availableSeats} available)
                        </p>
                        <p className="text-xs text-stone-400 font-mono mt-0.5">{b.id}</p>
                      </div>
                      <select
                        value={b.status ?? 'open'}
                        onChange={(e) => changeStatus(b.id, e.target.value)}
                        aria-label={`Status for ${b.code}`}
                        className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                      >
                        <option value="draft">draft</option>
                        <option value="open">open</option>
                        <option value="closed">closed</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs">
                      <Link
                        href={`/admin/enrollments?batchId=${b.id}`}
                        className="underline text-stone-600 dark:text-stone-400"
                      >
                        Enrollments →
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSelectedBatchId(b.id)}
                        className="underline text-stone-600 dark:text-stone-400"
                      >
                        Manage instructors
                      </button>
                    </div>
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
