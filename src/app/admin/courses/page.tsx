'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Course, PricingPlan } from '@/lib/types';
import { formatPrice } from '@/lib/format';
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

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [amountMinor, setAmountMinor] = useState('499900');
  const [currency, setCurrency] = useState('INR');
  const [accessMonths, setAccessMonths] = useState('24');
  const [planMsg, setPlanMsg] = useState('');
  const [planErr, setPlanErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { courses } = await api.adminCourses();
      setCourses(courses ?? []);
      if (courses?.length && !selectedCourseId) {
        setSelectedCourseId(courses[0].id);
      }
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  const loadPlans = useCallback(async (cid: string) => {
    if (!cid) return;
    try {
      const { pricingPlans } = await api.adminPricingPlans(cid);
      setPlans(pricingPlans ?? []);
    } catch {
      setPlans([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.adminCourses()
      .then(({ courses }) => {
        if (!active) return;
        setCourses(courses ?? []);
        if (courses?.length) {
          setSelectedCourseId((prev) => prev || courses[0].id);
        }
      })
      .catch(() => {
        if (active) setCourses([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    let active = true;
    api.adminPricingPlans(selectedCourseId)
      .then(({ pricingPlans }) => {
        if (active) setPlans(pricingPlans ?? []);
      })
      .catch(() => {
        if (active) setPlans([]);
      });
    return () => {
      active = false;
    };
  }, [selectedCourseId]);

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
      setSelectedCourseId(course.id);
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

  const archive = async (id: string) => {
    setError('');
    setOk('');
    try {
      await api.archiveCourse(id);
      setOk(`Archived ${id}`);
      await load();
    } catch (e: unknown) {
      setError(apiErr(e));
    }
  };

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setPlanErr('');
    setPlanMsg('');
    try {
      const { pricingPlan } = await api.createPricingPlan(selectedCourseId, {
        amountMinor: parseInt(amountMinor, 10),
        currency,
        accessMonthsDefault: parseInt(accessMonths, 10),
        active: true,
      });
      setPlanMsg(`Created plan ${pricingPlan.id}`);
      await loadPlans(selectedCourseId);
    } catch (e: unknown) {
      setPlanErr(apiErr(e));
    }
  };

  const togglePlan = async (p: PricingPlan) => {
    setPlanErr('');
    try {
      await api.updatePricingPlan(p.id, { active: !p.active });
      await loadPlans(selectedCourseId);
    } catch (e: unknown) {
      setPlanErr(apiErr(e));
    }
  };

  return (
    <Guard requireAdmin allowInstructor={false}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">
          Courses & Pricing Plans
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
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

            <AdminForm
              title="Add pricing plan"
              error={planErr}
              ok={planMsg}
              submitLabel="Create pricing plan"
              onSubmit={createPlan}
            >
              <Field label="Course" htmlFor="plan-course">
                <select
                  id="plan-course"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className={inputCls}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.slug})
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Amount (minor)" htmlFor="plan-amt">
                  <input
                    id="plan-amt"
                    type="number"
                    min={0}
                    required
                    value={amountMinor}
                    onChange={(e) => setAmountMinor(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Currency" htmlFor="plan-cur">
                  <input
                    id="plan-cur"
                    required
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Access (months)" htmlFor="plan-mos">
                  <input
                    id="plan-mos"
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={accessMonths}
                    onChange={(e) => setAccessMonths(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </AdminForm>
          </div>

          <div className="space-y-6">
            <section className="card-calm rounded-2xl p-6">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">All courses</h2>
              {loading ? (
                <p className="text-sm text-stone-500">Loading…</p>
              ) : courses.length === 0 ? (
                <p className="text-sm text-stone-500">None yet.</p>
              ) : (
                <ul className="space-y-3">
                  {courses.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 text-sm border-b border-stone-100 dark:border-white/10 pb-2.5 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-stone-900 dark:text-stone-100">
                          {c.title}{' '}
                          <span className="text-stone-500 font-normal">
                            ({c.slug} · {c.status})
                          </span>
                        </p>
                        <p className="text-xs text-stone-400 font-mono">{c.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.status !== 'published' && (
                          <button
                            onClick={() => publish(c.id)}
                            className="px-3 py-1 rounded-xl border border-stone-300 dark:border-white/10 text-xs font-medium hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                          >
                            Publish
                          </button>
                        )}
                        {c.status !== 'archived' && (
                          <button
                            onClick={() => archive(c.id)}
                            className="px-3 py-1 rounded-xl border border-stone-300 dark:border-white/10 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card-calm rounded-2xl p-6">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                Pricing plans for selected course
              </h2>
              {plans.length === 0 ? (
                <p className="text-sm text-stone-500">No pricing plans configured for this course.</p>
              ) : (
                <ul className="space-y-2.5">
                  {plans.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                          {formatPrice(p.amountMinor, p.currency)}
                        </span>{' '}
                        <span className="text-stone-500">
                          · {p.accessMonthsDefault} months · {p.active ? 'active' : 'inactive'}
                        </span>
                        <div className="text-xs text-stone-400 font-mono">{p.id}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePlan(p)}
                        className="px-3 py-1 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-medium"
                      >
                        {p.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </Guard>
  );
}
