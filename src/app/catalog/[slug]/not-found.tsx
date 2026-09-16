import Link from 'next/link';

export default function CourseNotFound() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Course not found</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        This course doesn&apos;t exist or isn&apos;t published yet.
      </p>
      <Link
        href="/catalog"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-zinc-900 px-5 text-white dark:bg-white dark:text-zinc-900 font-medium"
      >
        Back to catalog
      </Link>
    </main>
  );
}
