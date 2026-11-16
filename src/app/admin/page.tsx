'use client';
import Link from 'next/link';
import Guard from '@/components/Guard';

const TABS = [
  ['/admin/users', 'Users & RBAC', 'Manage users, roles, and account status'],
  ['/admin/courses', 'Courses & Pricing', 'Create, publish, archive + pricing plans'],
  ['/admin/batches', 'Batches & Mentors', 'Create batches, manage status + instructors'],
  ['/admin/enrollments', 'Enrollments', 'Enroll students + manage enrollment state'],
  ['/admin/curriculum', 'Curriculum', 'Modules, lessons, resources, prerequisites'],
  ['/admin/live', 'Live & Recordings', 'Classes, quick-class, attendance, recordings'],
  ['/admin/questions', 'Questions', 'Author questions, versions, and testcases'],
  ['/admin/announcements', 'Announcements', 'Publish global, course, or batch updates'],
  ['/admin/contests', 'Contests', 'Create timed coding contests'],
  ['/admin/commerce', 'Commerce & Refunds', 'Invoices, order refunds, and notifications'],
  ['/admin/feedback', 'Feedback', 'Review and respond to student feedback'],
] as const;

export default function AdminIndex() {
  return (
    <Guard requireAdmin>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">Admin studio</h1>
        <p className="text-stone-600 dark:text-stone-400 mb-8">
          Full user → course → batch → enroll → curriculum → live → commerce flow without Postman.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TABS.map(([href, label, desc]) => (
            <Link
              key={href}
              href={href}
              className="card-calm card-calm-hover block rounded-2xl p-6 group"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{label}</h2>
                <span className="text-stone-400 group-hover:text-amber-500 transition-colors">→</span>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">{desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </Guard>
  );
}
