'use client';
import { useEffect, useState } from 'react';
import { api, normalizeCatalog } from '@/lib/api';
import { Course } from '@/lib/types';
import CourseCard from '@/components/CourseCard';

export default function CatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const reloadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.catalog();
      setCourses(normalizeCatalog(data));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api
      .catalog()
      .then((data) => {
        if (!active) return;
        setCourses(normalizeCatalog(data));
        setError(null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Failed to load courses');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
      (course.description ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">Course Catalog</h1>
        <p className="text-stone-600 dark:text-stone-400">Browse available courses and find your next learning path.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#0F1319] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            aria-label="Search courses"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)}
          className="px-4 py-2 border border-stone-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#0F1319] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          aria-label="Filter by level"
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400" role="alert">
          <p>{error}</p>
          <button onClick={reloadCourses} className="mt-2 text-sm text-amber-400 underline hover:no-underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-stone-200 dark:border-white/10 rounded-xl p-6 animate-pulse bg-white dark:bg-[#0F1319]">
              <div className="h-5 bg-stone-200 dark:bg-white/10 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-stone-200 dark:bg-white/10 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-stone-200 dark:bg-white/10 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-stone-200 dark:bg-white/10 rounded w-full mb-2"></div>
              <div className="h-4 bg-stone-200 dark:bg-white/10 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="mt-2 text-lg font-medium text-stone-900 dark:text-stone-100">No courses found</h3>
          <p className="mt-1 text-stone-500 dark:text-stone-400">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Courses">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </main>
  );
}