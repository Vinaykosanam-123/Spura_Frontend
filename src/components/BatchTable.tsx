import type { Batch } from '@/lib/types';
import { batchEnd, batchStart, batchTitle } from '@/lib/types';
import { formatDate, formatPrice } from '@/lib/format';

export default function BatchTable({ batches }: { batches: Batch[] }) {
  if (!batches || batches.length === 0) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 text-center text-zinc-500 dark:text-zinc-400">
        No open batches right now. Check back soon.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
          <tr>
            <th className="px-4 py-3 font-medium">Batch</th>
            <th className="px-4 py-3 font-medium">Dates</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Seats</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
          {batches.map((b) => (
            <tr key={b.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">{batchTitle(b)}</div>
                <div className="text-xs text-zinc-500">{b.code}</div>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                {formatDate(batchStart(b))} → {formatDate(batchEnd(b))}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatPrice(b.tuitionAmountMinor, b.currency)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    b.availableSeats > 0
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                >
                  {b.availableSeats} available
                </span>
                <span className="text-zinc-500"> / {b.capacity}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
