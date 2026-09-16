'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

export default function AdminQuestions() {
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
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
  const [vtError, setVtError] = useState('');
  const [vtOk, setVtOk] = useState('');

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.createQuestion({
        slug,
        title,
        topic,
        difficulty,
        externalUrl: externalUrl || undefined,
        status: 'published',
      });
      setOk(`201 question created: ${slug}`);
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
      await api.createVersion(questionId, { statement });
      setVtOk('Version created');
    } catch (e: unknown) {
      setVtError(apiErr(e));
    }
  };

  const testcase = async (e: React.FormEvent) => {
    e.preventDefault();
    setVtError('');
    setVtOk('');
    try {
      await api.createTestcase(versionId, { stdin, expected });
      setVtOk('Testcase added');
    } catch (e: unknown) {
      setVtError(apiErr(e));
    }
  };

  return (
    <Guard requireAdmin>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Questions</h1>
        <div className="space-y-6">
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
            <Field label="stdin" htmlFor="ti"><textarea id="ti" required value={stdin} onChange={(e) => setStdin(e.target.value)} className={inputCls} rows={2} /></Field>
            <Field label="expected" htmlFor="te"><textarea id="te" required value={expected} onChange={(e) => setExpected(e.target.value)} className={inputCls} rows={2} /></Field>
          </AdminForm>
        </div>
      </main>
    </Guard>
  );
}
