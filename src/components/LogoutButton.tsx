'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LogoutButton() {
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await api.logout();
        } catch {
          // session may already be gone — still redirect
        } finally {
          r.push('/login');
          r.refresh();
        }
      }}
      className="text-sm font-medium px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
    >
      {busy ? 'Logging out…' : 'Logout'}
    </button>
  );
}
