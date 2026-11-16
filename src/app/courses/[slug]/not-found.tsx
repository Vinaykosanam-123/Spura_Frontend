import Link from 'next/link';

export default function CourseNotFound() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Course not found</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400">
        This course doesn&apos;t exist or isn&apos;t published yet.
      </p>
      <Link
        href="/courses"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-stone-950 font-semibold transition-colors"
      >
        Back to catalog
      </Link>
    </main>
  );
}
