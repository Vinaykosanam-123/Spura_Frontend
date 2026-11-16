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
      className="text-sm font-medium px-4 py-2 rounded-xl border border-stone-300 dark:border-white/10 text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
    >
      {busy ? 'Logging out…' : 'Logout'}
    </button>
  );
}
