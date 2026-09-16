'use client';
import Link from 'next/link';
import Guard from '@/components/Guard';

const TABS = [
  ['/admin/courses', 'Courses', 'Create + publish courses'],
  ['/admin/batches', 'Batches', 'Create batches per course'],
  ['/admin/enrollments', 'Enrollments', 'Enroll students by userId'],
  ['/admin/curriculum', 'Curriculum', 'Modules, lessons, resources'],
  ['/admin/live', 'Live', 'Classes, quick-class, recordings'],
  ['/admin/questions', 'Questions', 'Author + link + versions'],
  ['/admin/announcements', 'Announcements', 'Publish to batches'],
] as const;

export default function AdminIndex() {
  return (
    <Guard requireAdmin>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Admin studio</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Full course → batch → enroll → curriculum → live flow without Postman.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TABS.map(([href, label, desc]) => (
            <Link
              key={href}
              href={href}
              className="block border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 bg-white dark:bg-zinc-900 hover:border-zinc-400"
            >
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{label}</h2>
              <p className="text-sm text-zinc-500 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </Guard>
  );
}
