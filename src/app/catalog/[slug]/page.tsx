import Link from 'next/link';
import { notFound } from 'next/navigation';
import BatchTable from '@/components/BatchTable';
import type { CourseDetail } from '@/lib/types';
import { courseDurationLabel } from '@/lib/format';

export const revalidate = 60;

async function getCourse(slug: string): Promise<CourseDetail | null> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  const res = await fetch(`${base}/api/v1/catalog/courses/${slug}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  // Backend returns { course, batches }; tolerate bare-course shape too
  if (data && data.course) return { course: data.course, batches: data.batches ?? [] };
  return { course: data, batches: data.batches ?? [] };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let course: CourseDetail | null;
  try {
    course = await getCourse(slug);
  } catch (e) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="p-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400" role="alert">
          <p className="font-medium">Couldn&apos;t load this course</p>
          <p className="text-sm mt-1">{e instanceof Error ? e.message : 'Unknown error'}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <a href={`/catalog/${slug}`} className="underline hover:no-underline">Retry</a>
            <Link href="/catalog" className="underline hover:no-underline">Back to catalog</Link>
          </div>
        </div>
      </main>
    );
  }

  if (!course) notFound();

  const rawOutcomes = course.course.learningOutcomes;
  let outcomes: string[] = [];
  if (Array.isArray(rawOutcomes)) outcomes = rawOutcomes;
  else if (typeof rawOutcomes === 'string') {
    try {
      const parsed = JSON.parse(rawOutcomes as unknown as string);
      outcomes = Array.isArray(parsed) ? parsed : [];
    } catch {
      outcomes = [];
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/catalog" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
        ← Back to catalog
      </Link>

      <div className="mt-4 flex items-start gap-3 flex-wrap">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{course.course.title}</h1>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          {course.course.level} · {courseDurationLabel(course.course)}
        </span>
      </div>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">{course.course.description}</p>

      <section className="mt-8" aria-label="What you will learn">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          What you&apos;ll learn
        </h2>
        {outcomes.length === 0 ? (
          <p className="text-zinc-500">Outcomes will be listed here.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300">
            {outcomes.map((o: string, i: number) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-label="Open batches">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Open batches
        </h2>
        <BatchTable batches={course.batches} />
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Enrollment is handled by an admin — contact us to request a seat in an open batch.
          (Checkout is out of scope for this release.)
        </p>
      </section>
    </main>
  );
}
