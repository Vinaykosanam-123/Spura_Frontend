'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Course, CurriculumEntry, CurriculumModule, CurriculumLesson } from '@/lib/types';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

export default function AdminCurriculum() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [tree, setTree] = useState<CurriculumEntry | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [mSeq, setMSeq] = useState('1');
  const [mTitle, setMTitle] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [lSeq, setLSeq] = useState('1');
  const [lTitle, setLTitle] = useState('');
  const [lType, setLType] = useState('video');
  const [lessonId, setLessonId] = useState('');
  const [rSeq, setRSeq] = useState('1');
  const [rTitle, setRTitle] = useState('');
  const [rUrl, setRUrl] = useState('');
  const [preId, setPreId] = useState('');

  useEffect(() => {
    api.adminCourses().then(({ courses }) => {
      setCourses(courses ?? []);
      if (courses?.length) setCourseId(courses[0].id);
    }).catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    if (!courseId) return;
    setError('');
    try {
      const data = await api.adminCurriculum(courseId);
      setTree(data as CurriculumEntry);
    } catch (e: unknown) {
      setError(apiErr(e));
    }
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;
    let active = true;
    api.adminCurriculum(courseId)
      .then((data) => {
        if (!active) return;
        setError('');
        setTree(data as CurriculumEntry);
      })
      .catch((e: unknown) => {
        if (active) setError(apiErr(e));
      });
    return () => {
      active = false;
    };
  }, [courseId]);

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setError('');
    setOk('');
    try {
      await fn();
      setOk(okMsg);
      await refresh();
    } catch (e: unknown) {
      setError(apiErr(e));
    }
  };

  return (
    <Guard requireAdmin>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">Curriculum</h1>
        <div className="mb-6 max-w-md">
          <Field label="Course" htmlFor="course">
            <select id="course" value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title} ({c.slug})</option>
              ))}
            </select>
          </Field>
        </div>
        {error && <p className="mb-4 p-2 text-sm rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" role="alert">{error}</p>}
        {ok && <p className="mb-4 p-2 text-sm rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" role="status">{ok}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <AdminForm title="Create module" submitLabel="Create" onSubmit={(e) => { e.preventDefault(); run(() => api.createModule(courseId, { sequence: +mSeq, title: mTitle }), '201 module created'); }}>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Sequence" htmlFor="ms"><input id="ms" type="number" min={1} required value={mSeq} onChange={(e) => setMSeq(e.target.value)} className={inputCls} /></Field>
                <div className="col-span-2"><Field label="Title" htmlFor="mt"><input id="mt" required value={mTitle} onChange={(e) => setMTitle(e.target.value)} className={inputCls} /></Field></div>
              </div>
            </AdminForm>

            <AdminForm title="Publish module" submitLabel="Publish" onSubmit={(e) => { e.preventDefault(); run(() => api.publishModule(moduleId), 'Module published'); }}>
              <Field label="Module ID" htmlFor="pm"><input id="pm" required value={moduleId} onChange={(e) => setModuleId(e.target.value)} className={inputCls} /></Field>
            </AdminForm>

            <AdminForm title="Create lesson" submitLabel="Create" onSubmit={(e) => { e.preventDefault(); run(() => api.createLesson(moduleId, { sequence: +lSeq, title: lTitle, type: lType }), '201 lesson created'); }}>
              <Field label="Module ID" htmlFor="lm"><input id="lm" required value={moduleId} onChange={(e) => setModuleId(e.target.value)} className={inputCls} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Seq" htmlFor="ls"><input id="ls" type="number" min={1} required value={lSeq} onChange={(e) => setLSeq(e.target.value)} className={inputCls} /></Field>
                <div className="col-span-2"><Field label="Title" htmlFor="lt"><input id="lt" required value={lTitle} onChange={(e) => setLTitle(e.target.value)} className={inputCls} /></Field></div>
              </div>
              <Field label="Type" htmlFor="ly">
                <select id="ly" value={lType} onChange={(e) => setLType(e.target.value)} className={inputCls}>
                  <option value="video">video</option>
                  <option value="article">article</option>
                  <option value="live_session">live_session</option>
                </select>
              </Field>
            </AdminForm>

            <AdminForm title="Publish lesson" submitLabel="Publish" onSubmit={(e) => { e.preventDefault(); run(() => api.publishLesson(lessonId), 'Lesson published'); }}>
              <Field label="Lesson ID" htmlFor="pl"><input id="pl" required value={lessonId} onChange={(e) => setLessonId(e.target.value)} className={inputCls} /></Field>
              <p className="text-xs text-stone-500">Module must be published first (else MODULE_NOT_PUBLISHED).</p>
            </AdminForm>

            <AdminForm title="Add resource" submitLabel="Add" onSubmit={(e) => { e.preventDefault(); run(() => api.createResource(lessonId, { sequence: +rSeq, title: rTitle, resourceUrl: rUrl, contentType: 'link' }), 'Resource added'); }}>
              <Field label="Lesson ID" htmlFor="rl"><input id="rl" required value={lessonId} onChange={(e) => setLessonId(e.target.value)} className={inputCls} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Seq" htmlFor="rs"><input id="rs" type="number" min={1} required value={rSeq} onChange={(e) => setRSeq(e.target.value)} className={inputCls} /></Field>
                <div className="col-span-2"><Field label="Title" htmlFor="rt"><input id="rt" required value={rTitle} onChange={(e) => setRTitle(e.target.value)} className={inputCls} /></Field></div>
              </div>
              <Field label="URL" htmlFor="ru"><input id="ru" required value={rUrl} onChange={(e) => setRUrl(e.target.value)} className={inputCls} /></Field>
            </AdminForm>

            <AdminForm title="Add prerequisite" submitLabel="Add" onSubmit={(e) => { e.preventDefault(); run(() => api.createPrerequisite(lessonId, preId), 'Prerequisite added'); }}>
              <Field label="Lesson ID" htmlFor="xl"><input id="xl" required value={lessonId} onChange={(e) => setLessonId(e.target.value)} className={inputCls} /></Field>
              <Field label="Prerequisite lesson ID" htmlFor="xp"><input id="xp" required value={preId} onChange={(e) => setPreId(e.target.value)} className={inputCls} /></Field>
            </AdminForm>
          </div>

          <section className="card-calm rounded-2xl p-6 h-fit">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100">
                Curriculum tree (click item to select ID)
              </h2>
              <button onClick={refresh} className="text-sm underline hover:no-underline">Refresh</button>
            </div>
            {!tree ? (
              <p className="text-sm text-stone-500">Select a course to load its curriculum.</p>
            ) : (
              <div className="max-h-[600px] overflow-auto">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-3">{tree.course.title}</p>
                {tree.modules.map((m: CurriculumModule) => (
                  <div key={m.id} className="mb-4 border border-stone-100 dark:border-stone-800 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setModuleId(m.id)}
                        className="text-left text-sm font-semibold text-stone-800 dark:text-stone-200 hover:underline"
                      >
                        {m.sequence}. {m.title}
                      </button>
                      <span className="text-[11px] uppercase px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                        {m.status ?? 'draft'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-mono">{m.id}</p>
                    <ul className="ml-4 mt-2 space-y-1.5">
                      {m.lessons.map((l: CurriculumLesson) => (
                        <li key={l.id} className="text-xs text-stone-600 dark:text-stone-400">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setLessonId(l.id)}
                              className="flex items-center gap-2 hover:underline text-left"
                            >
                              <span className={`inline-block h-1.5 w-1.5 rounded-xl ${l.status === 'published' ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`} />
                              {l.sequence}. {l.title}
                              <span className="text-stone-400 dark:text-stone-500">({l.type})</span>
                            </button>
                            <span className="text-[10px] uppercase text-stone-400">{l.status ?? 'draft'}</span>
                          </div>
                          <p className="ml-3.5 text-[10px] text-stone-400 font-mono">{l.id}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </Guard>
  );
}
