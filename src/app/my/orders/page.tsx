'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';
import type { CheckoutSession, Invoice, PaymentOrder, Refund } from '@/lib/types';
import { formatDateTime, formatPrice } from '@/lib/format';
import Empty from '@/components/Empty';

export default function OrdersAndBillingPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutSession | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState('');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const loadAll = () =>
    Promise.all([
      api.myOrders(),
      api.myInvoices().catch(() => ({ invoices: [] as Invoice[] })),
      api.myRefunds().catch(() => ({ refunds: [] as Refund[] })),
    ]).then(([ordRes, invRes, refRes]) => {
      setOrders(ordRes.orders ?? []);
      setInvoices(invRes.invoices ?? []);
      setRefunds(refRes.refunds ?? []);
    });

  useEffect(() => {
    let active = true;
    Promise.all([
      api.myOrders(),
      api.myInvoices().catch(() => ({ invoices: [] as Invoice[] })),
      api.myRefunds().catch(() => ({ refunds: [] as Refund[] })),
    ])
      .then(([ordRes, invRes, refRes]) => {
        if (!active) return;
        setOrders(ordRes.orders ?? []);
        setInvoices(invRes.invoices ?? []);
        setRefunds(refRes.refunds ?? []);
      })
      .catch((e: unknown) => {
        if (!active) return;
        if ((e as ApiError)?.status === 401) {
          router.push('/login');
          return;
        }
        setError(e instanceof Error ? e.message : 'Failed to load billing details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const handleCheckout = async (orderId: string) => {
    setError('');
    setActiveOrderId(orderId);
    try {
      const session = await api.checkoutOrder(orderId);
      setCheckoutInfo(session);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not initiate checkout session.');
    }
  };

  const handleSandboxComplete = async (orderId: string) => {
    setError('');
    setBusyOrderId(orderId);
    try {
      await api.sandboxCompleteOrder(orderId);
      setCheckoutInfo(null);
      setActiveOrderId(null);
      await loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not complete sandbox payment.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const viewInvoice = async (invoiceId: string) => {
    setError('');
    try {
      const { invoice } = await api.myInvoiceDetail(invoiceId);
      setSelectedInvoice(invoice);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load invoice details.');
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Orders & billing
          </h1>
          <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-400">
            Track your course orders, checkout sessions, tax invoices, and refunds.
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex h-9 items-center rounded-xl border border-stone-200 dark:border-white/10 px-3.5 text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
        >
          Browse courses
        </Link>
      </div>

      {error && (
        <div
          className="mt-6 p-3.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {checkoutInfo && (
        <section
          className="mt-6 card-calm rounded-2xl p-5 border-l-4 border-l-amber-500"
          aria-label="Active checkout session"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                Checkout session · {checkoutInfo.provider}
              </p>
              <p className="mt-1 text-base font-semibold text-stone-900 dark:text-stone-100">
                Order {checkoutInfo.providerOrderId} ·{' '}
                {formatPrice(checkoutInfo.amountMinor, checkoutInfo.currency)}
              </p>
              <p className="mt-1 text-xs text-stone-500 font-mono">
                Provider Order: {checkoutInfo.providerOrderId}
              </p>
              {checkoutInfo.provider === 'sandbox' && activeOrderId ? (
                <button
                  type="button"
                  onClick={() => handleSandboxComplete(activeOrderId)}
                  disabled={busyOrderId === activeOrderId}
                  className="mt-3 inline-flex h-9 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-4 text-xs font-semibold text-stone-950 transition-colors disabled:opacity-50"
                >
                  {busyOrderId === activeOrderId ? 'Completing payment…' : 'Complete Sandbox Payment ✓'}
                </button>
              ) : checkoutInfo.checkoutUrl ? (
                <a
                  href={checkoutInfo.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-9 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-4 text-xs font-semibold text-stone-950 transition-colors"
                >
                  Open payment gateway ↗
                </a>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setCheckoutInfo(null)}
              className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white"
            >
              Close
            </button>
          </div>
        </section>
      )}

      {selectedInvoice && (
        <section
          className="mt-6 card-calm rounded-2xl p-6"
          aria-label="Invoice detail"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                Invoice #{selectedInvoice.invoiceNumber}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">
                Total: {formatPrice(selectedInvoice.amountMinor, selectedInvoice.currency)}
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                Tax included: {formatPrice(selectedInvoice.taxAmountMinor, selectedInvoice.currency)} ·
                Status: <span className="uppercase font-medium">{selectedInvoice.status}</span> ·
                Issued: {formatDateTime(selectedInvoice.issuedAt)}
              </p>
              <p className="mt-1 text-xs text-stone-500 font-mono">
                Order ID: {selectedInvoice.orderId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white"
            >
              Close
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-stone-500">Loading billing history…</p>
      ) : (
        <div className="mt-8 space-y-10">
          <section aria-label="Payment orders">
            <h2 className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-3">
              Orders ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <Empty
                title="No orders yet"
                hint="Select a batch on any course page to create an enrollment order."
                cta={{ label: 'Browse catalog', href: '/courses' }}
              />
            ) : (
              <div className="overflow-x-auto card-calm rounded-2xl">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-stone-200 dark:border-white/10 text-stone-500 dark:text-stone-400 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-white/10">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-stone-900 dark:text-stone-100">
                            {o.providerOrderId}
                          </div>
                          <div className="text-xs text-stone-500 font-mono">{o.id}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                          {formatPrice(o.amountMinor, o.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-stone-200/70 dark:bg-white/10 text-stone-700 dark:text-stone-300">
                            {o.state}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-500 whitespace-nowrap text-xs">
                          {formatDateTime(o.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {o.state === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleCheckout(o.id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition-colors"
                            >
                              Checkout
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-label="Tax invoices">
            <h2 className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-3">
              Invoices ({invoices.length})
            </h2>
            {invoices.length === 0 ? (
              <p className="text-sm text-stone-500">
                Invoices are generated automatically when an order is paid.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {invoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="card-calm rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {inv.invoiceNumber} · {formatPrice(inv.amountMinor, inv.currency)}
                      </p>
                      <p className="text-xs text-stone-500">
                        Issued {formatDateTime(inv.issuedAt)} · Status: {inv.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => viewInvoice(inv.id)}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5"
                    >
                      Inspect
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {refunds.length > 0 && (
            <section aria-label="Refunds">
              <h2 className="text-[17px] font-semibold tracking-tight text-stone-900 dark:text-stone-50 mb-3">
                Refunds ({refunds.length})
              </h2>
              <ul className="space-y-2.5">
                {refunds.map((r) => (
                  <li
                    key={r.id}
                    className="card-calm rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {formatPrice(r.amountMinor, r.currency)} · {r.reason}
                      </p>
                      <p className="text-xs text-stone-500">
                        Order {r.orderId} · {formatDateTime(r.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-stone-200/70 dark:bg-white/10 text-stone-700 dark:text-stone-300">
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
