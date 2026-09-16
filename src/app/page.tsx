import Link from 'next/link';
import CourseCard from '@/components/CourseCard';
import type { Course } from '@/lib/types';

export const revalidate = 60;

async function getFeatured(): Promise<{ courses: Course[]; error: string | null }> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return { courses: [], error: 'API URL not configured' };
  try {
    const res = await fetch(`${base}/api/v1/catalog/courses`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      const text = await res.text();
      return { courses: [], error: `${res.status} ${text.slice(0, 200)}` };
    }
    const data = await res.json();
    const courses: Course[] = Array.isArray(data) ? data : data.courses ?? [];
    return { courses: courses.slice(0, 3), error: null };
  } catch (e) {
    return { courses: [], error: e instanceof Error ? e.message : 'Failed to load courses' };
  }
}

export default async function Home() {
  const { courses, error } = await getFeatured();

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black font-sans">
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="py-16 sm:py-24 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-2xl">
            Learn by building. Get mentored live.
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-xl">
            Cohort-based courses with live classes, hands-on practice, and 2-year access to
            everything you enroll in.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:items-center">
            <Link
              href="/catalog"
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-white dark:bg-white dark:text-zinc-900 font-medium hover:opacity-90"
            >
              Browse courses
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 px-6 font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Student login
            </Link>
          </div>
        </section>

        {/* Featured */}
        <section className="pb-16" aria-label="Featured courses">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Featured courses
            </h2>
            <Link href="/catalog" className="text-sm font-medium text-zinc-600 dark:text-zinc-300 underline hover:no-underline">
              View all →
            </Link>
          </div>

          {error ? (
            <div className="p-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400" role="alert">
              <p className="font-medium">Couldn&apos;t load courses</p>
              <p className="text-sm mt-1">{error}</p>
              <a href="/" className="mt-3 inline-block text-sm underline hover:no-underline">
                Retry
              </a>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-6 border border-zinc-200 dark:border-zinc-700 rounded-lg text-center text-zinc-500 dark:text-zinc-400">
              No published courses yet. Check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
