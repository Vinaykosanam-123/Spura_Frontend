'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Batch, ClassAttendance, LiveClass } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

export default function AdminLive() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState('');
  const [classes, setClasses] = useState<LiveClass[]>([]);
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

  const [revokeUserId, setRevokeUserId] = useState('');
  const [revokeMsg, setRevokeMsg] = useState('');
  const [revokeErr, setRevokeErr] = useState('');
  const [attendance, setAttendance] = useState<ClassAttendance[]>([]);

  const loadClasses = useCallback(async (bid: string) => {
    if (!bid) return;
    try {
      const { classes } = await api.batchClasses(bid);
      setClasses(classes ?? []);
    } catch {
      setClasses([]);
    }
  }, []);

  useEffect(() => {
    api
      .adminBatches()
      .then(({ batches }) => {
        setBatches(batches ?? []);
        if (batches?.length) setBatchId(batches[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!batchId) return;
    let active = true;
    api.batchClasses(batchId)
      .then(({ classes }) => {
        if (active) setClasses(classes ?? []);
      })
      .catch(() => {
        if (active) setClasses([]);
      });
    return () => {
      active = false;
    };
  }, [batchId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const { class: created } = await api.createClass(batchId, {
        title,
        provider,
        meetingUrl: meetingUrl || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        status: 'scheduled',
      });
      setOk(`201 class created (${created.id})`);
      setPatchId(created.id);
      setTitle('');
      await loadClasses(batchId);
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
      await loadClasses(batchId);
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
      await loadClasses(batchId);
    } catch (e: unknown) {
      setPatchError(apiErr(e));
    }
  };

  const inspectAttendance = async (cid: string) => {
    setPatchId(cid);
    try {
      const { attendance } = await api.classAttendance(cid);
      setAttendance(attendance ?? []);
    } catch {
      setAttendance([]);
    }
  };

  const handleRevokeRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patchId || !revokeUserId) return;
    setRevokeErr('');
    setRevokeMsg('');
    try {
      await api.revokeRecordingAccess(patchId, revokeUserId.trim());
      setRevokeMsg(`Revoked recording access for user ${revokeUserId} on class ${patchId}`);
      setRevokeUserId('');
    } catch (e: unknown) {
      setRevokeErr(apiErr(e));
    }
  };

  return (
    <Guard requireAdmin>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">
          Live classes & recordings
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <AdminForm title="Create class" error={error} ok={ok} busy={busy} submitLabel="Create" onSubmit={create}>
              <Field label="Batch ID" htmlFor="b1">
                {batches.length > 0 ? (
                  <select id="b1" value={batchId} onChange={(e) => setBatchId(e.target.value)} className={inputCls}>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} — {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input id="b1" required value={batchId} onChange={(e) => setBatchId(e.target.value)} className={inputCls} />
                )}
              </Field>
              <Field label="Title" htmlFor="t1">
                <input id="t1" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Provider" htmlFor="p1">
                  <select id="p1" value={provider} onChange={(e) => setProvider(e.target.value)} className={inputCls}>
                    <option value="zoho">zoho</option>
                    <option value="zoom">zoom</option>
                    <option value="meet">meet</option>
                    <option value="youtube">youtube</option>
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
              <p className="text-xs text-stone-500">Uses the same batch + schedule as above.</p>
            </AdminForm>

            <AdminForm title="End class + set recording" error={patchError} ok={patchOk} submitLabel="Patch class" onSubmit={patch}>
              <Field label="Class ID" htmlFor="pc">
                <input id="pc" required value={patchId} onChange={(e) => setPatchId(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Recording URL" htmlFor="pr">
                <input id="pr" value={recUrl} onChange={(e) => setRecUrl(e.target.value)} className={inputCls} placeholder="https://…" />
              </Field>
              <p className="text-xs text-stone-500">Sets status <code>ended</code> — recording then appears for students.</p>
            </AdminForm>

            <AdminForm
              title="Revoke student recording access"
              error={revokeErr}
              ok={revokeMsg}
              submitLabel="Revoke recording access"
              onSubmit={handleRevokeRecording}
            >
              <Field label="Class ID" htmlFor="rc">
                <input id="rc" required value={patchId} onChange={(e) => setPatchId(e.target.value)} className={inputCls} />
              </Field>
              <Field label="User ID" htmlFor="ru">
                <input id="ru" required value={revokeUserId} onChange={(e) => setRevokeUserId(e.target.value)} className={inputCls} />
              </Field>
            </AdminForm>
          </div>

          <div className="space-y-6">
            <section className="card-calm rounded-2xl p-6">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                Classes in selected batch ({classes.length})
              </h2>
              {classes.length === 0 ? (
                <p className="text-sm text-stone-500">No classes scheduled for this batch yet.</p>
              ) : (
                <ul className="space-y-3">
                  {classes.map((c) => (
                    <li key={c.id} className="border border-stone-200 dark:border-white/10 rounded-xl p-3.5 text-sm bg-stone-50/50 dark:bg-[#06080B]/60">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-stone-900 dark:text-stone-100">
                            {c.title} <span className="text-xs text-stone-500">[{c.status}]</span>
                          </p>
                          <p className="text-xs text-stone-500">
                            {formatDateTime(c.scheduledAt)} · {c.provider}
                          </p>
                          <p className="text-xs text-stone-400 font-mono mt-0.5">{c.id}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => inspectAttendance(c.id)}
                          className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-white/10 text-xs font-medium hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        >
                          Select & attendance
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {patchId && (
              <section className="card-calm rounded-2xl p-6">
                <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                  Attendance for class {patchId.slice(0, 8)}… ({attendance.length})
                </h2>
                {attendance.length === 0 ? (
                  <p className="text-sm text-stone-500">No attendance records yet.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {attendance.map((a) => (
                      <li key={a.enrollmentId} className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
                        <span>
                          {a.fullName} ({a.email})
                        </span>
                        <span className="text-stone-500">{formatDateTime(a.joinedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
      </main>
    </Guard>
  );
}
