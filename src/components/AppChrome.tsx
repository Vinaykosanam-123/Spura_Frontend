'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import LogoutButton from '@/components/LogoutButton';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

const STUDENT_PREFIXES = ['/my', '/practice', '/bank', '/contests'];

function isStudentPath(path: string): boolean {
  return STUDENT_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

const TABS = [
  { href: '/my', label: 'Dashboard', match: ['/my'] },
  { href: '/my/courses', label: 'My Courses', match: ['/my/courses', '/my/curriculum', '/my/lessons'] },
  { href: '/practice', label: 'Practice', match: ['/practice', '/bank'] },
  { href: '/visualize', label: 'Visualizers', match: ['/visualize'] },
  { href: '/contests', label: 'Contests', match: ['/contests'] },
  { href: '/my/notifications', label: 'Notifications', match: ['/my/notifications'] },
  { href: '/my/orders', label: 'Orders & Billing', match: ['/my/orders'] },
  { href: '/my/feedback', label: 'Feedback', match: ['/my/feedback'] },
  { href: '/my/settings', label: 'Settings', match: ['/my/settings'] },
] as const;

function getRoleBadge(roles?: string[]): string {
  if (!roles || roles.length === 0) return 'Student';
  if (roles.includes('admin')) return 'Admin';
  if (roles.includes('mentor') || roles.includes('instructor')) return 'Instructor';
  return 'Student';
}

function getInitials(name?: string, email?: string): string {
  const src = (name || email || 'U').trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return src.slice(0, 2).toUpperCase();
}

function StudentShell({
  children,
  user,
  authChecked,
}: {
  children: React.ReactNode;
  user: User | null;
  authChecked: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const linkCls = (active: boolean) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      active
        ? 'bg-amber-500 text-stone-950 font-semibold'
        : 'text-slate-300 hover:text-white hover:bg-white/5'
    }`;
  const isActive = (t: (typeof TABS)[number]) =>
    t.match.some((m) =>
      m === '/my' ? pathname === '/my' : pathname === m || pathname.startsWith(`${m}/`),
    );

  const isAdmin = Boolean(user?.roles?.includes('admin'));
  const isStaff =
    isAdmin ||
    Boolean(user?.roles?.includes('mentor') || user?.roles?.includes('instructor'));

  return (
    <div className="min-h-full flex flex-col bg-[#090C10] text-slate-50">
      {/* Desktop top header */}
      <header className="hidden md:block sticky top-0 z-50 border-b border-white/10 bg-[#080B11]/90 backdrop-blur-md">
        <nav className="px-6 h-16 flex items-center gap-4" aria-label="Brand">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="SPURA home">
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-gradient-to-br from-amber-400 to-orange-500 text-stone-950 text-[13px] font-extrabold shadow-md shadow-amber-500/20">
              SP
            </span>
            <span className="text-[16px] font-bold tracking-tight text-white">SPURA</span>
          </Link>
          <div className="hidden lg:flex items-center gap-1 ml-4 pl-4 border-l border-white/10 text-xs font-medium">
            <Link
              href="/courses"
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Roadmap
            </Link>
            <Link
              href="/coding"
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-white/5 transition-colors"
            >
              Coding Compiler
            </Link>
            <Link
              href="/visualize"
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-white/5 transition-colors"
            >
              11 Visualizers
            </Link>
            <Link
              href="/bank"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/bank')
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              450+ Sheet
            </Link>
            <Link
              href="/contests"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/contests')
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Contests
            </Link>
          </div>
          <div className="flex-1" />
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2.5 ml-2 pl-2 border-l border-white/10">
              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10"
                title={`Verified session: ${user.email}`}
              >
                <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold">
                  {getInitials(user.fullName, user.email)}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#080B11]"
                    title="Verified User"
                  />
                </span>
                <span className="text-xs font-medium text-slate-200 max-w-[130px] truncate">
                  {user.fullName || user.email}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {getRoleBadge(user.roles)}
                </span>
              </div>
              <LogoutButton />
            </div>
          ) : authChecked ? (
            <div className="flex items-center gap-2 ml-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white border border-white/15 hover:bg-white/5 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors"
              >
                Sign up
              </Link>
            </div>
          ) : null}
        </nav>
      </header>
      <div className="flex-1 md:flex min-h-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-50 border-b border-white/10 bg-[#080B11]/90 backdrop-blur-md">
          <nav className="px-4 h-16 flex items-center" aria-label="Student">
            <Link href="/" className="flex items-center gap-2" aria-label="SPURA home">
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-gradient-to-br from-amber-400 to-orange-500 text-stone-950 text-[13px] font-extrabold">
                SP
              </span>
              <span className="font-bold text-white text-sm">SPURA</span>
            </Link>
            <div className="flex-1" />
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-200 hover:bg-white/10 text-xl"
            >
              ☰
            </button>
          </nav>
        </header>
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-label="Menu">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0F1319] border-r border-white/10 p-4 flex flex-col gap-1 overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-2 mb-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-gradient-to-br from-amber-400 to-orange-500 text-stone-950 text-[13px] font-extrabold">
                  SP
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10 text-xl"
                >
                  ✕
                </button>
              </div>
              {user && (
                <div className="mb-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10">
                  <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>
              )}
              {TABS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(t) ? 'page' : undefined}
                  className={linkCls(isActive(t))}
                >
                  {t.label}
                </Link>
              ))}
              <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1">
                <Link href="/coding" onClick={() => setMenuOpen(false)} className={linkCls(false)}>
                  Coding Compiler
                </Link>
                <Link href="/courses" onClick={() => setMenuOpen(false)} className={linkCls(false)}>
                  Course Roadmap
                </Link>
                {isStaff && (
                  <Link href="/studio" onClick={() => setMenuOpen(false)} className={linkCls(false)}>
                    Course Studio
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className={linkCls(false)}>
                    Admin Console
                  </Link>
                )}
              </div>
              <div className="flex-1" />
              <div className="px-2 py-2">
                {user ? (
                  <LogoutButton />
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="w-full py-2 text-center rounded-xl text-xs font-semibold border border-white/15 text-white"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="w-full py-2 text-center rounded-xl text-xs font-bold bg-amber-500 text-stone-950"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Desktop left sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/10 bg-[#0F1319]/90 sticky top-16 h-[calc(100vh-4rem)] p-4 gap-1 overflow-y-auto">
          <nav className="flex flex-col gap-1" aria-label="Student">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={isActive(t) ? 'page' : undefined}
                className={linkCls(isActive(t))}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1">
            <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Interactive Labs
            </p>
            <Link href="/coding" className={linkCls(false)}>
              Coding Compiler
            </Link>
            <Link href="/courses" className={linkCls(false)}>
              Course Roadmap
            </Link>
            {isStaff && (
              <Link href="/studio" className={linkCls(pathname.startsWith('/studio'))}>
                Course Studio
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className={linkCls(pathname.startsWith('/admin'))}>
                Admin Console
              </Link>
            )}
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    </div>
  );
}

const SITE_NAV_ITEMS = [
  { href: '/#batch-2', label: 'Batch 2.0', match: [], cls: 'hidden xl:inline-flex' },
  { href: '/courses', label: 'Roadmap', match: ['/courses'], cls: 'hidden md:inline-flex' },
  { href: '/coding', label: 'Compiler', match: ['/coding'], cls: 'hidden md:inline-flex' },
  { href: '/visualize', label: 'Visualizers', match: ['/visualize'], cls: 'hidden md:inline-flex' },
  { href: '/bank', label: '450+ Sheet', match: ['/bank'], cls: 'hidden lg:inline-flex' },
  { href: '/contests', label: 'Contests', match: ['/contests'], cls: 'hidden lg:inline-flex' },
] as const;

function SiteHeader({ user, authChecked }: { user: User | null; authChecked: boolean }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = Boolean(user?.roles?.includes('admin'));
  const isStaff =
    isAdmin ||
    Boolean(user?.roles?.includes('mentor') || user?.roles?.includes('instructor'));

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080B11]/95 backdrop-blur-md">
      <nav
        className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2"
        aria-label="Main"
      >
        <Link href="/" className="flex items-center gap-2 group shrink-0" aria-label="SPURA home">
          <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-gradient-to-br from-amber-400 to-orange-500 text-stone-950 text-[13px] font-extrabold shadow-md shadow-amber-500/20">
            SP
          </span>
          <span className="text-[16px] sm:text-[17px] font-bold tracking-tight text-white flex items-center gap-1.5">
            SPURA
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Batch 2.0
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {SITE_NAV_ITEMS.map((item) => {
            const active = item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`${item.cls} px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-1.5 ml-1">
              {isStaff && (
                <Link
                  href="/studio"
                  className="hidden lg:inline-flex h-9 items-center px-3 rounded-xl text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                >
                  Studio
                </Link>
              )}
              <Link
                href="/my"
                title={`Signed in as ${user.fullName} (${user.email})`}
                className="inline-flex h-9 items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-xs font-semibold text-white transition-colors"
              >
                <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-stone-950 text-[10px] font-extrabold">
                  {getInitials(user.fullName, user.email)}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#080B11]" />
                </span>
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {user.fullName || 'My Space'}
                </span>
              </Link>
              <span className="hidden sm:inline-flex">
                <LogoutButton />
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 ml-1">
              <Link
                href="/login"
                className="inline-flex h-9 items-center px-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 hover:text-white border border-white/15 hover:bg-white/5 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="glow-btn inline-flex h-9 items-center px-2.5 sm:px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/25 hover:opacity-95 transition-opacity"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile & Tablet Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden ml-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-200 hover:bg-white/10 text-lg"
          >
            ☰
          </button>
          {!authChecked && <span className="sr-only">Checking session</span>}
        </div>
      </nav>

      {/* Mobile & Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[70]" role="dialog" aria-label="Navigation menu">
          <div className="fixed inset-0 bg-black/70" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[#0F1319] border-l border-white/10 p-4 flex flex-col gap-1.5 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-stone-950 text-xs font-extrabold">
                  SP
                </span>
                <span className="font-bold text-white text-sm">SPURA Navigation</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {user && (
              <div className="mb-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {getRoleBadge(user.roles)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
              </div>
            )}

            <Link
              href="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Course Roadmap
            </Link>
            <Link
              href="/coding"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Coding Compiler &amp; Tracer
            </Link>
            <Link
              href="/visualize"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              11 Interactive Visualizers
            </Link>
            <Link
              href="/bank"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              450+ Company Problem Sheet
            </Link>
            <Link
              href="/contests"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Live Contests Arena
            </Link>

            {user && (
              <Link
                href="/my"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl text-sm font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25"
              >
                My Study Space →
              </Link>
            )}
            {isStaff && (
              <Link
                href="/studio"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                Course Studio
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                Admin Console
              </Link>
            )}

            <div className="flex-1" />
            <div className="pt-3 mt-3 border-t border-white/10">
              {user ? (
                <LogoutButton />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center rounded-xl text-xs font-semibold border border-white/15 text-white hover:bg-white/5"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center rounded-xl text-xs font-bold bg-amber-500 text-stone-950"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-stone-800/80 bg-[#080B11] py-12 text-stone-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-stone-950 text-xs font-extrabold">
                SP
              </span>
              <span className="font-bold text-white text-base">SPURA</span>
            </div>
            <p className="text-xs leading-relaxed text-stone-400">
              India&apos;s first visual algorithmic learning platform. Placement bootcamp in Telugu
              &amp; English with live classes and diagrammatic compiler.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-3">
              Platform
            </h4>
            <div className="flex flex-col gap-2 text-xs">
              <Link href="/login" className="hover:text-white">
                Student Login
              </Link>
              <Link href="/register" className="hover:text-white">
                Create Account (Sign Up)
              </Link>
              <Link href="/courses" className="hover:text-white">
                16-Week Curriculum
              </Link>
              <Link href="/visualize" className="hover:text-white">
                Interactive Visualizer
              </Link>
              <Link href="/bank" className="hover:text-white">
                450+ Problem Sheet
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-3">
              Visualizers
            </h4>
            <div className="flex flex-col gap-2 text-xs">
              <Link href="/visualize?tab=sorting" className="hover:text-white">
                Sorting &amp; Arrays
              </Link>
              <Link href="/visualize?tab=linked-list" className="hover:text-white">
                Linked List Inversion
              </Link>
              <Link href="/visualize?tab=bst" className="hover:text-white">
                Binary Search Tree
              </Link>
              <Link href="/visualize?tab=stack" className="hover:text-white">
                Stack &amp; Queue LIFO
              </Link>
              <Link href="/visualize?tab=graph" className="hover:text-white">
                Graph BFS/DFS
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-3">
              Studio &amp; Admin
            </h4>
            <div className="flex flex-col gap-2 text-xs">
              <Link href="/studio" className="text-amber-400 hover:text-amber-300 font-semibold">
                Course Studio (Instructor Access) →
              </Link>
              <Link href="/admin" className="hover:text-white">
                Admin Console →
              </Link>
              <span className="text-stone-500">Student Support: info@spura.io</span>
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© 2026 SPURA. All rights reserved. Crafted for engineers.</p>
          <div className="flex gap-4">
            <Link href="/#batch-2" className="hover:text-stone-300">
              Privacy Policy
            </Link>
            <Link href="/#batch-2" className="hover:text-stone-300">
              Terms of Service
            </Link>
            <Link href="/#batch-2" className="hover:text-stone-300">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((res) => {
        if (!cancelled) {
          setUser(res.user ?? null);
          setAuthChecked(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setUser(null);
          setAuthChecked(true);
          const status = (err as { status?: number })?.status;
          if (status === 401 && isStudentPath(pathname)) {
            router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (isStudentPath(pathname)) {
    return (
      <StudentShell user={user} authChecked={authChecked}>
        {children}
      </StudentShell>
    );
  }
  return (
    <>
      <SiteHeader user={user} authChecked={authChecked} />
      <div className="flex-1 flex flex-col">{children}</div>
      {!pathname.startsWith('/coding') && <SiteFooter />}
    </>
  );
}
