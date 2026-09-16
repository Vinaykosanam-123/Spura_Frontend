'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Course } from '@/lib/types';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

export default function AdminBatches() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startAt, setStartAt] = useState('2026-10-01T04:30');
  const [endAt, setEndAt] = useState('2027-01-31T12:30');
  const [capacity, setCapacity] = useState('50');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.adminCourses().then(({ courses }) => {
      setCourses(courses ?? []);
      if (courses?.length && !courseId) setCourseId(courses[0].id);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        timezone: 'Asia/Kolkata',
        status: 'open',
      }) as { batch: { id: string; code: string } };
      setOk(`201 created batch ${batch.code} (${batch.id})`);
      setCode('');
      setName('');
    } catch (e: unknown) {
      setError(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Guard requireAdmin>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Batches</h1>
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
          <Field label="Capacity" htmlFor="cap">
            <input id="cap" type="number" min={1} required value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inputCls} />
          </Field>
        </AdminForm>
        <p className="mt-4 text-sm text-zinc-500">
          Batch id from the 201 response is shown above — use it on the{' '}
          <Link href="/admin/enrollments" className="underline">Enrollments</Link> tab.
        </p>
      </main>
    </Guard>
  );
}
