'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';
import type { NotificationItem } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import Empty from '@/components/Empty';

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const PAGE_SIZE = 50;

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const data = await api.myNotifications({ unreadOnly, limit: PAGE_SIZE, offset: 0 });
      const fetched = data.notifications ?? [];
      setItems(fetched);
      setHasMore(fetched.length === PAGE_SIZE);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (e: unknown) {
      if ((e as ApiError)?.status === 401) {
        router.push('/login');
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [router, unreadOnly]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await api.myNotifications({
        unreadOnly,
        limit: PAGE_SIZE,
        offset: items.length,
      });
      const fetched = data.notifications ?? [];
      setItems((prev) => [...prev, ...fetched]);
      setHasMore(fetched.length === PAGE_SIZE);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.myNotifications({ unreadOnly, limit: PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (!active) return;
        const fetched = data.notifications ?? [];
        setItems(fetched);
        setHasMore(fetched.length === PAGE_SIZE);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch((e: unknown) => {
        if (active && (e as ApiError)?.status === 401) {
          router.push('/login');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router, unreadOnly]);

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      await load();
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    setBusy(true);
    setErr('');
    try {
      await api.markAllNotificationsRead();
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not mark notifications as read.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-10">
      {err && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {err}
        </div>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Notifications
          </h1>
          <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`
              : 'All caught up.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUnreadOnly((v) => !v)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              unreadOnly
                ? 'bg-amber-500 text-stone-950 border-transparent'
                : 'border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5'
            }`}
          >
            {unreadOnly ? 'Showing unread' : 'Unread only'}
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={markAllRead}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-stone-500">Loading notifications…</p>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <Empty
            title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            hint="Enrollment updates, class reminders, and billing receipts appear here."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((n) => {
            const isUnread = !n.readAt && !n.isRead;
            return (
              <li
                key={n.id}
                className={`card-calm rounded-2xl p-5 flex items-start justify-between gap-4 ${
                  isUnread ? 'border-l-4 border-l-amber-500' : 'opacity-80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                      {n.type}
                    </span>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-1 text-[15px] font-semibold text-stone-900 dark:text-stone-100">
                    {n.title}
                  </h2>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap">
                    {n.body}
                  </p>
                </div>
                {isUnread && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="shrink-0 px-3 py-1 rounded-lg border border-stone-200 dark:border-white/10 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5"
                  >
                    Mark read
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!loading && hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={loadMore}
            className="px-4 py-2 rounded-xl border border-stone-200 dark:border-white/10 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more notifications'}
          </button>
        </div>
      )}
    </main>
  );
}
