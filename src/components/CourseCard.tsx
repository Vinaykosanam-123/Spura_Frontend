import Link from 'next/link';
import type { Course } from '@/lib/types';
import { courseDurationLabel } from '@/lib/format';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.slug}`} className="block group">
      <article className="card-calm card-calm-hover rounded-2xl p-6 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-[17px] font-semibold tracking-tight leading-snug text-stone-900 dark:text-stone-50 line-clamp-2 group-hover:text-amber-400 transition-colors">{course.title}</h3>
        </div>
        <p className="text-[14px] leading-relaxed text-stone-600 dark:text-stone-400 line-clamp-3 flex-1">{course.description}</p>
        <div className="mt-5 pt-4 border-t border-stone-100 dark:border-white/10 flex items-center justify-between text-[13px]">
          <span className="flex items-center gap-4 text-stone-500 dark:text-stone-400">
            <span className="inline-flex items-center gap-1.5 capitalize">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  course.level === 'beginner'
                    ? 'bg-emerald-600'
                    : course.level === 'intermediate'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                }`}
              />
              {course.level}
            </span>
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {courseDurationLabel(course)}
            </span>
          </span>
          <span className="font-medium text-stone-700 dark:text-stone-300">
            {course.openBatchCount} open
          </span>
        </div>
      </article>
    </Link>
  );
}