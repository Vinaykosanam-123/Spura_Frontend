'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

export default function AdminQuestions() {
  const [existing, setExisting] = useState<Array<{ id: string; slug: string; title: string; topic: string; difficulty: string }>>([]);
  const [search, setSearch] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('arrays');
  const [difficulty, setDifficulty] = useState('easy');
  const [externalUrl, setExternalUrl] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [lessonId, setLessonId] = useState('');
  const [questionId, setQuestionId] = useState('');
  const [seq, setSeq] = useState('1');
  const [linkError, setLinkError] = useState('');
  const [linkOk, setLinkOk] = useState('');

  const [versionId, setVersionId] = useState('');
  const [statement, setStatement] = useState('');
  const [stdin, setStdin] = useState('');
  const [expected, setExpected] = useState('');
  const [isSample, setIsSample] = useState(true);
  const [weight, setWeight] = useState('1');
  const [vtError, setVtError] = useState('');
  const [vtOk, setVtOk] = useState('');

  useEffect(() => {
    let active = true;
    api.bankQuestions({ limit: 100, ...(search.trim() ? { q: search.trim() } : {}) })
      .then((res) => {
        if (active) setExisting(res.questions ?? []);
      })
      .catch(() => {
        if (active) setExisting([]);
      });
    return () => {
      active = false;
    };
  }, [search]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      const { question } = await api.createQuestion({
        slug,
        title,
        topic,
        difficulty,
        externalUrl: externalUrl || undefined,
        status: 'published',
      });
      setQuestionId(question.id);
      setOk(`201 question created: ${question.slug} (${question.id})`);
      setSlug('');
      setTitle('');
    } catch (e: unknown) {
      setError(apiErr(e));
    }
  };

  const link = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinkOk('');
    try {
      await api.linkQuestion(lessonId, { questionId, sequence: +seq });
      setLinkOk('Question linked to lesson');
    } catch (e: unknown) {
      setLinkError(apiErr(e));
    }
  };

  const version = async (e: React.FormEvent) => {
    e.preventDefault();
    setVtError('');
    setVtOk('');
    try {
      const { version } = await api.createVersion(questionId, { statement });
      setVersionId(version.id);
      setVtOk(`Version created (${version.id})`);
    } catch (e: unknown) {
      setVtError(apiErr(e));
    }
  };

  const testcase = async (e: React.FormEvent) => {
    e.preventDefault();
    setVtError('');
    setVtOk('');
    try {
      const { testcase } = await api.createTestcase(versionId, {
        stdin,
        expected,
        isSample,
        weight: parseInt(weight || '1', 10),
      });
      setVtOk(`Testcase added (${testcase.id}, isSample=${testcase.isSample})`);
    } catch (e: unknown) {
      setVtError(apiErr(e));
    }
  };

  return (
    <Guard requireAdmin>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">Questions</h1>
        <div className="space-y-6">
          <section className="card-calm rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                Existing questions ({existing.length}) — click to select Question ID
              </h2>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or topic…"
                className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-white/10 bg-white dark:bg-[#06080B] text-xs"
              />
            </div>
            {existing.length === 0 ? (
              <p className="text-xs text-stone-500">No matching questions loaded.</p>
            ) : (
              <div className="max-h-40 overflow-auto flex flex-wrap gap-1.5">
                {existing.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQuestionId(q.id)}
                    className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                      questionId === q.id
                        ? 'bg-amber-500 text-stone-950 font-semibold border-transparent'
                        : 'border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {q.title} <span className="opacity-60">({q.difficulty})</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <AdminForm title="Create question" error={error} ok={ok} submitLabel="Create" onSubmit={create}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Slug" htmlFor="qs"><input id="qs" required value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} /></Field>
              <Field label="Topic" htmlFor="qt"><input id="qt" required value={topic} onChange={(e) => setTopic(e.target.value)} className={inputCls} /></Field>
            </div>
            <Field label="Title" htmlFor="qn"><input id="qn" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Difficulty" htmlFor="qd">
                <select id="qd" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputCls}>
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </Field>
              <Field label="External URL (optional)" htmlFor="qe"><input id="qe" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className={inputCls} /></Field>
            </div>
          </AdminForm>

          <AdminForm title="Link question to lesson" error={linkError} ok={linkOk} submitLabel="Link" onSubmit={link}>
            <Field label="Lesson ID" htmlFor="ll"><input id="ll" required value={lessonId} onChange={(e) => setLessonId(e.target.value)} className={inputCls} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Field label="Question ID" htmlFor="lq"><input id="lq" required value={questionId} onChange={(e) => setQuestionId(e.target.value)} className={inputCls} /></Field></div>
              <Field label="Seq" htmlFor="ls"><input id="ls" type="number" min={1} value={seq} onChange={(e) => setSeq(e.target.value)} className={inputCls} /></Field>
            </div>
          </AdminForm>

          <AdminForm title="Add version (statement)" error={vtError} ok={vtOk} submitLabel="Add version" onSubmit={version}>
            <Field label="Question ID" htmlFor="vq"><input id="vq" required value={questionId} onChange={(e) => setQuestionId(e.target.value)} className={inputCls} /></Field>
            <Field label="Statement" htmlFor="vs"><textarea id="vs" required value={statement} onChange={(e) => setStatement(e.target.value)} className={inputCls} rows={4} /></Field>
          </AdminForm>

          <AdminForm title="Add testcase" error={vtError} ok={vtOk} submitLabel="Add testcase" onSubmit={testcase}>
            <Field label="Version ID" htmlFor="tv"><input id="tv" required value={versionId} onChange={(e) => setVersionId(e.target.value)} className={inputCls} /></Field>
            <Field label="stdin (optional)" htmlFor="ti"><textarea id="ti" value={stdin} onChange={(e) => setStdin(e.target.value)} className={inputCls} rows={2} /></Field>
            <Field label="expected stdout (optional)" htmlFor="te"><textarea id="te" value={expected} onChange={(e) => setExpected(e.target.value)} className={inputCls} rows={2} /></Field>
            <div className="grid grid-cols-2 gap-3 items-center">
              <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={isSample}
                  onChange={(e) => setIsSample(e.target.checked)}
                />
                Sample testcase (visible to students)
              </label>
              <Field label="Weight (1–100)" htmlFor="tw">
                <input id="tw" type="number" min={1} max={100} value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </AdminForm>
        </div>
      </main>
    </Guard>
  );
}
