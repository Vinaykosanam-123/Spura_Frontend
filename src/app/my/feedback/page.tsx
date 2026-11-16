'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';
import type { FeedbackItem } from '@/lib/types';
import { useToast } from '@/components/Toast';
import Empty from '@/components/Empty';

export default function FeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [category, setCategory] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<FeedbackItem[]>([]);

  const load = async () => {
    try {
      const data = await api.me().catch(() => null);
      if (!data) {
        router.push('/login');
        return;
      }
      const fb = await api.myFeedback().catch(() => ({ feedback: [] as FeedbackItem[] }));
      setItems(fb.feedback);
    } catch (e: unknown) {
      if ((e as ApiError)?.status === 401) router.push('/login');
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.me().catch(() => null);
        if (!active) return;
        if (!data) {
          router.push('/login');
          return;
        }
        const fb = await api.myFeedback().catch(() => ({ feedback: [] as FeedbackItem[] }));
        if (active) setItems(fb.feedback);
      } catch (e: unknown) {
        if (active && (e as ApiError)?.status === 401) router.push('/login');
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 3 || busy) return;
    setBusy(true);
    try {
      await api.submitFeedback({ category, message: message.trim() });
      toast('success', 'Thanks! Your feedback was recorded.');
      setMessage('');
      await load();
    } catch (err: unknown) {
      if ((err as ApiError)?.status === 401) {
        router.push('/login');
        return;
      }
      toast('error', 'Could not send feedback. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">
      <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        Feedback
      </h1>
      <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">
        Suggestions, bugs, content requests — we read everything.
      </p>

      <form onSubmit={submit} className="card-calm mt-6 rounded-2xl p-6 space-y-4">
        <div>
          <label
            htmlFor="fb-cat"
            className="block text-xs font-medium text-stone-600 dark:text-stone-300"
          >
            Category
          </label>
          <select
            id="fb-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#06080B] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          >
            <option value="suggestion">Suggestion</option>
            <option value="bug">Bug report</option>
            <option value="content">Question content</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="fb-msg"
            className="block text-xs font-medium text-stone-600 dark:text-stone-300"
          >
            Message
          </label>
          <textarea
            id="fb-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            minLength={3}
            maxLength={5000}
            placeholder="What should we add or fix?"
            className="mt-1 w-full px-3 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#06080B] text-sm text-stone-900 dark:text-stone-100 resize-y focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
        </div>
        <button
          type="submit"
          disabled={busy || message.trim().length < 3}
          className="inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-6 text-sm text-stone-950 font-semibold disabled:opacity-50 transition-colors"
        >
          {busy ? 'Sending…' : 'Send feedback'}
        </button>
      </form>

      <h2 className="mt-10 text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        Your past feedback
      </h2>
      {items.length === 0 ? (
        <div className="mt-3">
          <Empty title="Nothing yet" hint="Your sent feedback will appear here." />
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((f) => (
            <li key={f.id} className="card-calm rounded-2xl p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {f.category} · {new Date(f.createdAt).toLocaleString()}
                </p>
                {f.status && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {f.status.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                {f.message}
              </p>
              {f.adminResponse && (
                <div className="mt-3 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-100/70 dark:bg-[#06080B] p-3.5 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    Team response{f.respondedAt ? ` · ${new Date(f.respondedAt).toLocaleDateString()}` : ''}
                  </p>
                  <p className="mt-1 text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
                    {f.adminResponse}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
