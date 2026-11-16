'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Invoice, NotificationItem, PaymentOrder, Refund } from '@/lib/types';
import { formatDateTime, formatPrice } from '@/lib/format';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

type AdminOrder = PaymentOrder & {
  userId: string;
  userEmail: string;
  batchCode?: string | null;
};

export default function AdminCommercePage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('Admin initiated refund');
  const [amountMinor, setAmountMinor] = useState('');
  const [revokeEnrollment, setRevokeEnrollment] = useState('true');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ordRes, invRes, refRes, notifRes] = await Promise.all([
        api.adminOrders(),
        api.adminInvoices(),
        api.adminRefunds(),
        api.adminNotifications({ limit: 20 }),
      ]);
      setOrders(ordRes.orders ?? []);
      setInvoices(invRes.invoices ?? []);
      setRefunds(refRes.refunds ?? []);
      setNotifications(notifRes.notifications ?? []);
    } catch (e: unknown) {
      setError(apiErr(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.adminOrders(),
      api.adminInvoices(),
      api.adminRefunds(),
      api.adminNotifications({ limit: 20 }),
    ])
      .then(([ordRes, invRes, refRes, notifRes]) => {
        if (!active) return;
        setOrders(ordRes.orders ?? []);
        setInvoices(invRes.invoices ?? []);
        setRefunds(refRes.refunds ?? []);
        setNotifications(notifRes.notifications ?? []);
      })
      .catch((e: unknown) => {
        if (active) setError(apiErr(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const initiateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const payload: { reason: string; amountMinor?: number; revokeEnrollment?: boolean } = {
        reason,
        revokeEnrollment: revokeEnrollment === 'true',
      };
      if (amountMinor.trim()) {
        payload.amountMinor = parseInt(amountMinor, 10);
      }
      const { refund } = await api.createRefund(orderId.trim(), payload);
      setOk(`Refund initiated: ${refund.id} (${refund.status})`);
      setOrderId('');
      setAmountMinor('');
      await load();
    } catch (err: unknown) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Guard requireAdmin allowInstructor={false}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div>
          <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
            ← Studio
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100">
            Commerce, Refunds & System Events
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <AdminForm
              title="Initiate order refund"
              error={error}
              ok={ok}
              busy={busy}
              submitLabel="Process refund"
              onSubmit={initiateRefund}
            >
              <Field label="Order ID (UUID)" htmlFor="ref-order">
                <input
                  id="ref-order"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className={inputCls}
                  placeholder="Click an invoice order ID or paste UUID"
                />
              </Field>
              <Field label="Reason" htmlFor="ref-reason">
                <input
                  id="ref-reason"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Partial amount in minor units (optional)" htmlFor="ref-amt">
                <input
                  id="ref-amt"
                  type="number"
                  min={1}
                  value={amountMinor}
                  onChange={(e) => setAmountMinor(e.target.value)}
                  className={inputCls}
                  placeholder="Leave blank for full refund"
                />
              </Field>
              <Field label="Revoke enrollment & recording access" htmlFor="ref-revoke">
                <select
                  id="ref-revoke"
                  value={revokeEnrollment}
                  onChange={(e) => setRevokeEnrollment(e.target.value)}
                  className={inputCls}
                >
                  <option value="true">Yes — cancel enrollment & revoke recordings</option>
                  <option value="false">No — keep enrollment active</option>
                </select>
              </Field>
            </AdminForm>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <section className="card-calm rounded-2xl p-6">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                Payment orders ({orders.length})
              </h2>
              {loading ? (
                <p className="text-sm text-stone-500">Loading…</p>
              ) : orders.length === 0 ? (
                <p className="text-sm text-stone-500">No payment orders yet.</p>
              ) : (
                <ul className="space-y-2.5 max-h-[320px] overflow-auto">
                  {orders.map((ord) => (
                    <li
                      key={ord.id}
                      className="flex flex-wrap items-center justify-between gap-3 text-sm border-b border-stone-100 dark:border-white/10 pb-2.5 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-stone-100">
                          {ord.providerOrderId} · {formatPrice(ord.amountMinor, ord.currency)}{' '}
                          <span className="text-xs font-normal text-stone-500">({ord.userEmail})</span>
                        </p>
                        <p className="text-xs text-stone-500">
                          Order:{' '}
                          <button
                            type="button"
                            onClick={() => setOrderId(ord.id)}
                            className="font-mono underline hover:text-amber-600 dark:hover:text-amber-400"
                          >
                            {ord.id}
                          </button>{' '}
                          · {ord.batchCode ?? ord.batchId} · {formatDateTime(ord.createdAt)}
                        </p>
                      </div>
                      <span className="text-xs uppercase font-medium px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">
                        {ord.state}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card-calm rounded-2xl p-6">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                Issued invoices ({invoices.length})
              </h2>
              {loading ? (
                <p className="text-sm text-stone-500">Loading…</p>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-stone-500">No invoices issued yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {invoices.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-3 text-sm border-b border-stone-100 dark:border-white/10 pb-2.5 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-stone-100">
                          {inv.invoiceNumber} · {formatPrice(inv.amountMinor, inv.currency)}
                        </p>
                        <p className="text-xs text-stone-500">
                          Order:{' '}
                          <button
                            type="button"
                            onClick={() => setOrderId(inv.orderId)}
                            className="font-mono underline hover:text-amber-600 dark:hover:text-amber-400"
                          >
                            {inv.orderId}
                          </button>{' '}
                          · Issued {formatDateTime(inv.issuedAt)}
                        </p>
                      </div>
                      <span className="text-xs uppercase font-medium px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">
                        {inv.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card-calm rounded-2xl p-6">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                Refunds ({refunds.length})
              </h2>
              {refunds.length === 0 ? (
                <p className="text-sm text-stone-500">No refunds processed yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {refunds.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 text-sm border-b border-stone-100 dark:border-white/10 pb-2.5 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-stone-100">
                          {formatPrice(r.amountMinor, r.currency)} · {r.reason}
                        </p>
                        <p className="text-xs text-stone-500 font-mono">
                          Order: {r.orderId} · Refund: {r.id}
                        </p>
                      </div>
                      <span className="text-xs uppercase font-medium px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">
                        {r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <section className="card-calm rounded-2xl p-6">
          <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
            Recent platform notifications ({notifications.length})
          </h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-stone-500">No notifications recorded.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {n.title}
                    </span>
                    <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {n.type}
                    </span>
                  </div>
                  <p className="mt-1 text-stone-600 dark:text-stone-400">{n.body}</p>
                  <p className="mt-1 text-[11px] text-stone-400 font-mono">
                    User: {n.userId?.slice(0, 8)} · {formatDateTime(n.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </Guard>
  );
}
