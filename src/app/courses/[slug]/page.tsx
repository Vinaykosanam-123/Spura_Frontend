import Link from 'next/link';
import { notFound } from 'next/navigation';
import BatchTable from '@/components/BatchTable';
import { getServerApiBaseUrl, isDevBypassEnabled } from '@/lib/config';
import type { CourseDetail } from '@/lib/types';
import { courseDurationLabel } from '@/lib/format';

export const revalidate = 60;

async function getCourse(slug: string): Promise<CourseDetail | null> {
  const encoded = encodeURIComponent(slug);
  if (isDevBypassEnabled()) {
    const { mockResponse } = await import('@/lib/mock');
    const data = mockResponse(`/api/v1/catalog/courses/${encoded}`, 'GET');
    if (!data.course) return null;
    return { course: data.course, batches: data.batches ?? [], pricingPlans: data.pricingPlans ?? [] };
  }
  const base = getServerApiBaseUrl();
  const res = await fetch(`${base}/api/v1/catalog/courses/${encoded}`, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  // Backend returns { course, batches, pricingPlans }; tolerate bare-course shape too
  if (data && data.course) {
    return {
      course: data.course,
      batches: data.batches ?? [],
      pricingPlans: data.pricingPlans ?? [],
    };
  }
  return { course: data, batches: data.batches ?? [], pricingPlans: data.pricingPlans ?? [] };
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
        <div className="p-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-400" role="alert">
          <p className="font-medium">Couldn&apos;t load this course</p>
          <p className="text-sm mt-1">{e instanceof Error ? e.message : 'Unknown error'}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <a href={`/courses/${slug}`} className="underline hover:no-underline">Retry</a>
            <Link href="/courses" className="underline hover:no-underline">Back to catalog</Link>
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
      <Link href="/courses" className="text-sm text-stone-500 dark:text-slate-400 hover:text-amber-400">
        ← Back to catalog
      </Link>

      <div className="mt-4 flex items-start gap-3 flex-wrap">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">{course.course.title}</h1>
        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium capitalize bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/25">
          {course.course.level} · {courseDurationLabel(course.course)}
        </span>
      </div>
      <p className="mt-3 text-stone-600 dark:text-stone-400">{course.course.description}</p>

      <section className="mt-8" aria-label="What you will learn">
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-3">
          What you&apos;ll learn
        </h2>
        {outcomes.length === 0 ? (
          <p className="text-stone-500">Outcomes will be listed here.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1 text-stone-700 dark:text-stone-300">
            {outcomes.map((o: string, i: number) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-label="Open batches">
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-3">
          Open batches
        </h2>
        <BatchTable batches={course.batches} pricingPlans={course.pricingPlans} />
        <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
          Select an open batch above to create an order and proceed to checkout, or view your{' '}
          <Link href="/my/orders" className="underline underline-offset-4 hover:text-stone-900 dark:hover:text-white">
            orders and invoices
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
