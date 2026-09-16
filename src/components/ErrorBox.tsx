'use client';
import { useRouter } from 'next/navigation';

export default function ErrorBox({ message }: { message: string }) {
  const r = useRouter();
  return (
    <div
      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400"
      role="alert"
    >
      <p className="font-medium">Something went wrong</p>
      <p className="text-sm mt-1">{message}</p>
      <button
        onClick={() => r.refresh()}
        className="mt-2 text-sm underline hover:no-underline"
      >
        Retry
      </button>
    </div>
  );
}
