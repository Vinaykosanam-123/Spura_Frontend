'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Course } from '@/lib/types';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('beginner');
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { courses } = await api.adminCourses();
      setCourses(courses ?? []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
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
      const { course } = await api.createCourse({ slug, title, description, level, status });
      setOk(`201 created: ${course.slug} (${course.id})`);
      setSlug('');
      setTitle('');
      setDescription('');
      await load();
    } catch (e: unknown) {
      setError(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  const publish = async (id: string) => {
    setError('');
    setOk('');
    try {
      await api.publishCourse(id);
      setOk(`Published ${id}`);
      await load();
    } catch (e: unknown) {
      setError(apiErr(e));
    }
  };

  return (
    <Guard requireAdmin>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Courses</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminForm title="Create course" error={error} ok={ok} busy={busy} submitLabel="Create" onSubmit={create}>
            <Field label="Slug" htmlFor="slug">
              <input id="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} placeholder="my-course" />
            </Field>
            <Field label="Title" htmlFor="title">
              <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Description" htmlFor="desc">
              <textarea id="desc" required value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} rows={3} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Level" htmlFor="level">
                <select id="level" value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </Field>
              <Field label="Status" htmlFor="status">
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                </select>
              </Field>
            </div>
          </AdminForm>

          <section className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-5 bg-white dark:bg-zinc-900">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">All courses</h2>
            {loading ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-zinc-500">None yet.</p>
            ) : (
              <ul className="space-y-2">
                {courses.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {c.title} <span className="text-zinc-500">({c.slug} · {c.status})</span>
                    </span>
                    {c.status !== 'published' && (
                      <button
                        onClick={() => publish(c.id)}
                        className="px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 text-xs font-medium"
                      >
                        Publish
                      </button>
                    )}
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
