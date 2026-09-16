import Link from 'next/link';
import type { Course } from '@/lib/types';
import { courseDurationLabel } from '@/lib/format';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/catalog/${course.slug}`} className="block">
      <article className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors bg-white dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">{course.title}</h3>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
            course.level === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {course.level}
          </span>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-2">{course.description}</p>
        <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {courseDurationLabel(course)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            {course.openBatchCount} batch{course.openBatchCount !== 1 ? 'es' : ''} open
          </span>
        </div>
      </article>
    </Link>
  );
}