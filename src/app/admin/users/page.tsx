'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import Guard from '@/components/Guard';
import { AdminForm, Field, apiErr, inputCls } from '@/components/AdminForm';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const PAGE_SIZE = 50;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.adminUsers({
        q: q.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: 0,
      });
      const fetched = r.users ?? [];
      setUsers(fetched);
      setHasMore(fetched.length === PAGE_SIZE);
    } catch {
      setUsers([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter, statusFilter]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const r = await api.adminUsers({
        q: q.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: users.length,
      });
      const fetched = r.users ?? [];
      setUsers((prev) => [...prev, ...fetched]);
      setHasMore(fetched.length === PAGE_SIZE);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.adminUsers({
      q: q.trim() || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      limit: PAGE_SIZE,
      offset: 0,
    })
      .then((r) => {
        if (!active) return;
        const fetched = r.users ?? [];
        setUsers(fetched);
        setHasMore(fetched.length === PAGE_SIZE);
      })
      .catch(() => {
        if (!active) return;
        setUsers([]);
        setHasMore(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [q, roleFilter, statusFilter]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const r = await api.adminCreateUser({
        fullName,
        email,
        password,
        roles: [newRole],
      });
      setOk(`Created user ${r.user.email} (${r.user.id})`);
      setFullName('');
      setEmail('');
      setPassword('');
      await load();
    } catch (err: unknown) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (
    userId: string,
    status: 'active' | 'suspended' | 'deleted',
  ) => {
    setError('');
    setOk('');
    try {
      await api.adminUpdateUserStatus(userId, { status });
      setOk(`Updated user ${userId} status to ${status}`);
      await load();
    } catch (err: unknown) {
      setError(apiErr(err));
    }
  };

  const toggleRole = async (u: User, targetRole: string) => {
    setError('');
    setOk('');
    const raw = Array.isArray(u.roles) ? u.roles : [];
    const current = raw.map((r) => (r === 'mentor' ? 'instructor' : r));
    const next = current.includes(targetRole)
      ? current.filter((r) => r !== targetRole)
      : [...current, targetRole];
    if (next.length === 0) {
      setError('User must retain at least one role.');
      return;
    }
    try {
      await api.adminUpdateUserRoles(u.id, next);
      setOk(`Updated roles for ${u.email}: ${next.join(', ')}`);
      await load();
    } catch (err: unknown) {
      setError(apiErr(err));
    }
  };

  return (
    <Guard requireAdmin allowInstructor={false}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
          ← Studio
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">
          Users & RBAC
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <AdminForm
              title="Create user account"
              error={error}
              ok={ok}
              busy={busy}
              submitLabel="Create user"
              onSubmit={createUser}
            >
              <Field label="Full name" htmlFor="u-name">
                <input
                  id="u-name"
                  required
                  minLength={2}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputCls}
                  placeholder="Priya Nair"
                />
              </Field>
              <Field label="Email" htmlFor="u-email">
                <input
                  id="u-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="priya@spura.io"
                />
              </Field>
              <Field label="Password (min 8 chars, upper+lower+digit)" htmlFor="u-pw">
                <input
                  id="u-pw"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Initial role" htmlFor="u-role">
                <select
                  id="u-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className={inputCls}
                >
                  <option value="student">student</option>
                  <option value="instructor">instructor</option>
                  <option value="admin">admin</option>
                </select>
              </Field>
            </AdminForm>
          </div>

          <section className="lg:col-span-2 card-calm rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100">
                User directory ({users.length})
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name or email…"
                  className="px-3 py-1.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#06080B] text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#06080B] text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                >
                  <option value="">All roles</option>
                  <option value="student">student</option>
                  <option value="instructor">instructor</option>
                  <option value="admin">admin</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#06080B] text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                >
                  <option value="">All statuses</option>
                  <option value="active">active</option>
                  <option value="suspended">suspended</option>
                  <option value="deleted">deleted</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-stone-500">Loading users…</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-stone-500">No users match the filter.</p>
            ) : (
              <ul className="space-y-3">
                {users.map((u) => {
                  const roles = (Array.isArray(u.roles) ? u.roles : []).map((r) =>
                    r === 'mentor' ? 'instructor' : r,
                  );
                  return (
                    <li
                      key={u.id}
                      className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {u.fullName}{' '}
                          <span className="text-xs font-normal text-stone-500">
                            ({u.email})
                          </span>
                        </p>
                        <p className="text-xs text-stone-400 font-mono">{u.id}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(['student', 'instructor', 'admin'] as const).map((r) => {
                          const active = roles.includes(r);
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => toggleRole(u, r)}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                active
                                  ? 'bg-amber-500 text-stone-950 border-transparent'
                                  : 'border-stone-300 dark:border-white/10 text-stone-600 dark:text-stone-300'
                              }`}
                            >
                              {active ? '✓ ' : '+ '}
                              {r}
                            </button>
                          );
                        })}
                        <select
                          value={u.status ?? 'active'}
                          onChange={(e) =>
                            updateStatus(
                              u.id,
                              e.target.value as 'active' | 'suspended' | 'deleted',
                            )
                          }
                          className="px-2.5 py-1 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#06080B] text-xs"
                        >
                          <option value="active">active</option>
                          <option value="suspended">suspended</option>
                          <option value="deleted">deleted</option>
                        </select>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {!loading && hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={loadMore}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more users'}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </Guard>
  );
}
