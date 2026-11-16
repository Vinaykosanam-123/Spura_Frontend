'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';
import type { Batch, PricingPlan } from '@/lib/types';
import { batchEnd, batchStart, batchTitle } from '@/lib/types';
import { formatDate, formatPrice } from '@/lib/format';

export default function BatchTable({
  batches,
  pricingPlans = [],
}: {
  batches: Batch[];
  pricingPlans?: PricingPlan[];
}) {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    pricingPlans.find((p) => p.active)?.id ?? '',
  );
  const [busyBatchId, setBusyBatchId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  if (!batches || batches.length === 0) {
    return (
      <div className="border border-stone-200 dark:border-stone-700 rounded-xl p-6 text-center text-stone-500 dark:text-stone-400">
        No open batches right now. Check back soon.
      </div>
    );
  }

  const handleEnroll = async (b: Batch) => {
    setErrorMsg('');
    setStatusMsg('');
    setBusyBatchId(b.id);
    try {
      const applicablePlan = pricingPlans.find(
        (p) =>
          p.id === selectedPlanId &&
          p.active &&
          (p.batchId === null || p.batchId === b.id),
      );
      const { order } = await api.createOrder({
        batchId: b.id,
        ...(applicablePlan ? { planId: applicablePlan.id } : {}),
      });
      setCreatedOrderId(order.id);
      const session = await api.checkoutOrder(order.id);
      if (session.provider === 'sandbox') {
        setStatusMsg(
          `Order ${order.providerOrderId} created (${formatPrice(order.amountMinor, order.currency)}) in sandbox mode. Redirecting to Orders & Billing to complete payment…`,
        );
        router.push(`/my/orders?sandboxOrder=${encodeURIComponent(order.id)}`);
      } else if (session.checkoutUrl && session.checkoutUrl.startsWith('http')) {
        setStatusMsg(
          `Order ${order.providerOrderId} created (${formatPrice(order.amountMinor, order.currency)}) via ${session.provider}. Opening checkout…`,
        );
        window.open(session.checkoutUrl, '_blank', 'noopener,noreferrer');
      } else {
        setStatusMsg(
          `Order ${order.providerOrderId} created (${formatPrice(order.amountMinor, order.currency)}). Manage checkout & invoices in Orders & Billing.`,
        );
      }
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 401) {
        router.push('/login');
        return;
      }
      setErrorMsg(err?.message ?? 'Could not initiate enrollment order.');
    } finally {
      setBusyBatchId(null);
    }
  };

  return (
    <div className="space-y-4">
      {pricingPlans.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50/70 dark:bg-[#0F1319]">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Pricing plan:
          </span>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            aria-label="Select pricing plan"
            className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-white/10 bg-white dark:bg-[#090C10] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Standard batch tuition</option>
            {pricingPlans
              .filter((p) => p.active)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {formatPrice(p.amountMinor, p.currency)} · {p.accessMonthsDefault} months access
                </option>
              ))}
          </select>
        </div>
      )}

      {errorMsg && (
        <div
          className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {errorMsg}
        </div>
      )}

      {statusMsg && (
        <div
          className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-sm text-emerald-800 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-3"
          role="status"
        >
          <span>{statusMsg}</span>
          {createdOrderId && (
            <Link
              href="/my/orders"
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold"
            >
              View orders →
            </Link>
          )}
        </div>
      )}

      <div className="overflow-x-auto border border-stone-200 dark:border-white/10 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-stone-50 dark:bg-[#161B24] text-stone-600 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Batch</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Seats</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-white/10 bg-white dark:bg-[#0F1319]">
            {batches.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-stone-900 dark:text-stone-100">
                    {batchTitle(b)}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-slate-400">{b.code}</div>
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                  {formatDate(batchStart(b))} → {formatDate(batchEnd(b))}
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-medium text-amber-400">
                  {formatPrice(b.tuitionAmountMinor, b.currency)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      b.availableSeats > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {b.availableSeats} available
                  </span>
                  <span className="text-stone-500"> / {b.capacity}</span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    disabled={b.availableSeats <= 0 || busyBatchId === b.id}
                    onClick={() => handleEnroll(b)}
                    className="inline-flex h-8 items-center rounded-lg bg-amber-500 px-3.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors disabled:opacity-40"
                  >
                    {busyBatchId === b.id
                      ? 'Creating order…'
                      : b.availableSeats > 0
                        ? 'Enroll / Checkout'
                        : 'Full'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
