'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

export default function AdminLive() {
  const [batchId, setBatchId] = useState('');
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('zoho');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('2026-09-20T10:00');
  const [endsAt, setEndsAt] = useState('2026-09-20T11:00');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const [qcTopic, setQcTopic] = useState('');
  const [qcTitle, setQcTitle] = useState('');
  const [qSlug, setQSlug] = useState('');
  const [qTitle, setQTitle] = useState('');
  const [qcError, setQcError] = useState('');
  const [qcOk, setQcOk] = useState('');

  const [patchId, setPatchId] = useState('');
  const [recUrl, setRecUrl] = useState('');
  const [patchError, setPatchError] = useState('');
  const [patchOk, setPatchOk] = useState('');

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      await api.createClass(batchId, {
        title,
        provider,
        meetingUrl: meetingUrl || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        status: 'scheduled',
      });
      setOk('201 class created');
      setTitle('');
    } catch (e: unknown) {
      setError(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  const quick = async (e: React.FormEvent) => {
    e.preventDefault();
    setQcError('');
    setQcOk('');
    try {
      await api.quickClass(batchId, {
        topicTitle: qcTopic,
        classTitle: qcTitle,
        provider,
        scheduledAt: new Date(scheduledAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        questions: qSlug ? [{ slug: qSlug, title: qTitle || qSlug }] : [],
      });
      setQcOk('201 quick-class created (topic + lesson + class + questions)');
    } catch (e: unknown) {
      setQcError(apiErr(e));
    }
  };

  const patch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatchError('');
    setPatchOk('');
    try {
      await api.patchClass(patchId, { recordingUrl: recUrl || undefined, status: 'ended' });
      setPatchOk('Class patched — recording live for students');
    } catch (e: unknown) {
      setPatchError(apiErr(e));
    }
  };

  return (
    <Guard requireAdmin>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Live classes</h1>
        <div className="space-y-6">
          <AdminForm title="Create class" error={error} ok={ok} busy={busy} submitLabel="Create" onSubmit={create}>
            <Field label="Batch ID" htmlFor="b1">
              <input id="b1" required value={batchId} onChange={(e) => setBatchId(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Title" htmlFor="t1">
              <input id="t1" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Provider" htmlFor="p1">
                <select id="p1" value={provider} onChange={(e) => setProvider(e.target.value)} className={inputCls}>
                  <option value="zoho">zoho</option>
                  <option value="other">other</option>
                </select>
              </Field>
              <Field label="Meeting URL (optional)" htmlFor="m1">
                <input id="m1" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} className={inputCls} placeholder="https://…" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Scheduled at" htmlFor="s1">
                <input id="s1" type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Ends at" htmlFor="e1">
                <input id="e1" type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </AdminForm>

          <AdminForm title="Quick class (topic + lesson + class + questions tx)" error={qcError} ok={qcOk} submitLabel="Create quick class" onSubmit={quick}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Topic title" htmlFor="qt">
                <input id="qt" required value={qcTopic} onChange={(e) => setQcTopic(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Class title" htmlFor="qc">
                <input id="qc" required value={qcTitle} onChange={(e) => setQcTitle(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Question slug (optional)" htmlFor="qs">
                <input id="qs" value={qSlug} onChange={(e) => setQSlug(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Question title" htmlFor="qn">
                <input id="qn" value={qTitle} onChange={(e) => setQTitle(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <p className="text-xs text-zinc-500">Uses the same batch + schedule as above.</p>
          </AdminForm>

          <AdminForm title="End class + set recording" error={patchError} ok={patchOk} submitLabel="Patch class" onSubmit={patch}>
            <Field label="Class ID" htmlFor="pc">
              <input id="pc" required value={patchId} onChange={(e) => setPatchId(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Recording URL" htmlFor="pr">
              <input id="pr" value={recUrl} onChange={(e) => setRecUrl(e.target.value)} className={inputCls} placeholder="https://…" />
            </Field>
            <p className="text-xs text-zinc-500">Sets status <code>ended</code> — recording then appears for students.</p>
          </AdminForm>
        </div>
      </main>
    </Guard>
  );
}
