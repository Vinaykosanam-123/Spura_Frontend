'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type ApiError } from '@/lib/api';
import type { User } from '@/lib/types';
import { formatDateTime } from '@/lib/format';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [verifyToken, setVerifyToken] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyErr, setVerifyErr] = useState('');

  const load = useCallback(async () => {
    try {
      const { user } = await api.profile();
      setUser(user);
      setFullName(user.fullName ?? '');
      setPhone(user.phone ?? '');
    } catch (e: unknown) {
      if ((e as ApiError)?.status === 401) {
        router.push('/login');
      }
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    api.profile()
      .then(({ user }) => {
        if (!active) return;
        setUser(user);
        setFullName(user.fullName ?? '');
        setPhone(user.phone ?? '');
      })
      .catch((e: unknown) => {
        if (active && (e as ApiError)?.status === 401) {
          router.push('/login');
        }
      });
    return () => {
      active = false;
    };
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setSavingProfile(true);
    try {
      const { user: updated } = await api.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() ? phone.trim() : null,
      });
      setUser((prev) => (prev ? { ...prev, ...updated } : updated));
      setProfileMsg('Profile updated.');
    } catch (err: unknown) {
      setProfileErr(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    setSavingPw(true);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      setPwMsg(
        `${res.message} (${res.revokedSessionsCount} other session${res.revokedSessionsCount === 1 ? '' : 's'} revoked).`,
      );
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      setPwErr(err instanceof Error ? err.message : 'Password change failed.');
    } finally {
      setSavingPw(false);
    }
  };

  const handleRequestVerify = async () => {
    if (!user) return;
    setVerifyMsg('');
    setVerifyErr('');
    try {
      const res = await api.requestVerifyEmail(user.email);
      setVerifyMsg(res.message);
    } catch (err: unknown) {
      setVerifyErr(err instanceof Error ? err.message : 'Could not request verification.');
    }
  };

  const handleConfirmVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !verifyToken.trim()) return;
    setVerifyMsg('');
    setVerifyErr('');
    try {
      const res = await api.confirmVerifyEmail({
        email: user.email,
        token: verifyToken.trim(),
      });
      setVerifyMsg(res.message);
      setVerifyToken('');
      await load();
    } catch (err: unknown) {
      setVerifyErr(err instanceof Error ? err.message : 'Verification failed.');
    }
  };

  const handleLogoutAll = async () => {
    try {
      await api.logoutAll();
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">
        <p className="text-sm text-stone-500">Loading settings…</p>
      </main>
    );
  }

  const inputCls =
    'mt-1 w-full px-3.5 py-2.5 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#06080B] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500';

  return (
    <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Account settings
        </h1>
        <p className="mt-1 text-[15px] text-stone-600 dark:text-stone-400">
          {user.email} · Roles: {(user.roles ?? []).map((r) => (r === 'mentor' ? 'instructor' : r)).join(', ') || 'student'}
        </p>
      </div>

      {/* Profile section */}
      <section className="card-calm rounded-2xl p-6" aria-label="Profile details">
        <h2 className="text-[17px] font-semibold text-stone-900 dark:text-stone-50">
          Profile
        </h2>
        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
          <div>
            <label htmlFor="prof-name" className="block text-xs font-medium text-stone-600 dark:text-stone-300">
              Full name
            </label>
            <input
              id="prof-name"
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="prof-phone" className="block text-xs font-medium text-stone-600 dark:text-stone-300">
              Phone (optional, 7–15 digits)
            </label>
            <input
              id="prof-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              className={inputCls}
            />
          </div>
          {profileErr && <p className="text-xs text-red-600" role="alert">{profileErr}</p>}
          {profileMsg && <p className="text-xs text-emerald-700 dark:text-emerald-400" role="status">{profileMsg}</p>}
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex h-10 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm font-semibold text-stone-950 disabled:opacity-50 transition-colors"
          >
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      {/* Email Verification */}
      <section className="card-calm rounded-2xl p-6" aria-label="Email verification">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-semibold text-stone-900 dark:text-stone-50">
              Email verification
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              {user.emailVerifiedAt
                ? `Verified on ${formatDateTime(user.emailVerifiedAt)}`
                : 'Your email address is not verified yet.'}
            </p>
          </div>
          {!user.emailVerifiedAt && (
            <button
              type="button"
              onClick={handleRequestVerify}
              className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-white/10 text-xs font-medium hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
            >
              Send verification email
            </button>
          )}
        </div>
        {!user.emailVerifiedAt && (
          <form onSubmit={handleConfirmVerify} className="mt-4 flex gap-2">
            <input
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              placeholder="Paste verification token"
              className="flex-1 px-3 py-2 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#06080B] text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition-colors"
            >
              Confirm
            </button>
          </form>
        )}
        {verifyErr && <p className="mt-2 text-xs text-red-600" role="alert">{verifyErr}</p>}
        {verifyMsg && <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400" role="status">{verifyMsg}</p>}
      </section>

      {/* Change Password */}
      <section className="card-calm rounded-2xl p-6" aria-label="Change password">
        <h2 className="text-[17px] font-semibold text-stone-900 dark:text-stone-50">
          Change password
        </h2>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <div>
            <label htmlFor="cur-pw" className="block text-xs font-medium text-stone-600 dark:text-stone-300">
              Current password
            </label>
            <input
              id="cur-pw"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="new-pw" className="block text-xs font-medium text-stone-600 dark:text-stone-300">
              New password (8+ chars, uppercase, lowercase, digit)
            </label>
            <input
              id="new-pw"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          {pwErr && <p className="text-xs text-red-600" role="alert">{pwErr}</p>}
          {pwMsg && <p className="text-xs text-emerald-700 dark:text-emerald-400" role="status">{pwMsg}</p>}
          <button
            type="submit"
            disabled={savingPw}
            className="inline-flex h-10 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-sm font-semibold text-stone-950 disabled:opacity-50 transition-colors"
          >
            {savingPw ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      {/* Active Sessions */}
      <section className="card-calm rounded-2xl p-6 flex items-center justify-between gap-4" aria-label="Session security">
        <div>
          <h2 className="text-[16px] font-semibold text-stone-900 dark:text-stone-50">
            Sign out of all devices
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Revokes all active sessions across browsers and devices.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogoutAll}
          className="shrink-0 px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          Log out everywhere
        </button>
      </section>
    </main>
  );
}
