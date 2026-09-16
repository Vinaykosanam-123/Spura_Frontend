import type {
  Announcement,
  Batch,
  Course,
  CourseDetail,
  CurriculumEntry,
  Enrollment,
  LessonDetail,
  LessonQuestion,
  LiveClass,
  Progress,
  QuestionDetail,
  QuestionSample,
  Recording,
  User,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL!;

export interface ApiError extends Error {
  status: number;
  code?: string;
  fields?: unknown;
  body?: unknown;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    let body: unknown = text;
    let code: string | undefined;
    let fields: unknown;
    try {
      body = JSON.parse(text);
      const b = body as { code?: string; error?: string; fields?: unknown; message?: string };
      code = b.code ?? b.error;
      fields = b.fields;
    } catch {
      // keep raw text
    }
    const err = new Error(
      code ? `${res.status} ${code}` : `${res.status} ${text.slice(0, 200)}`
    ) as ApiError;
    err.status = res.status;
    err.code = code;
    err.fields = fields;
    err.body = body;
    throw err;
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

// --- Auth ---
export const api = {
  login: (email: string, password: string) =>
    req<{ user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (fullName: string, email: string, password: string) =>
    req<{ user: User }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    }),
  me: () => req<{ user: User }>('/api/v1/auth/me'),
  logout: () => req<null>('/api/v1/auth/logout', { method: 'POST' }),

  // --- Public catalog ---
  catalog: () => req<Course[] | { courses: Course[] }>('/api/v1/catalog/courses'),
  catalogDetail: (slug: string) =>
    req<CourseDetail | { course: Course; batches: Batch[] }>(
      `/api/v1/catalog/courses/${slug}`
    ),

  // --- Student ---
  enrollments: () =>
    req<{ enrollments: Enrollment[] }>('/api/v1/me/enrollments'),
  curriculum: () =>
    req<{ curriculum: CurriculumEntry[] }>('/api/v1/me/curriculum'),
  lessonDetail: (id: string) =>
    req<{ lesson: LessonDetail }>(`/api/v1/me/lessons/${id}`),
  saveProgress: (id: string, watchedSeconds: number) =>
    req<{ progress: { lessonId: string; watchedSeconds: number; completedAt: string | null; updatedAt: string } }>(
      `/api/v1/me/lessons/${id}/progress`,
      { method: 'POST', body: JSON.stringify({ watchedSeconds }) }
    ),
  completeLesson: (id: string) =>
    req<{ progress: { lessonId: string; watchedSeconds: number; completedAt: string | null; updatedAt: string } }>(
      `/api/v1/me/lessons/${id}/complete`,
      { method: 'POST' }
    ),
  upcoming: () => req<{ live: LiveClass[] }>('/api/v1/me/live/upcoming'),
  recordings: () => req<{ recordings: Recording[] }>('/api/v1/me/recordings'),
  announcements: () =>
    req<{ announcements: Announcement[] }>('/api/v1/me/announcements'),
  progress: () => req<{ progress: Progress[] }>('/api/v1/me/progress'),
  attendance: (classId: string) =>
    req<{ attended: boolean }>(`/api/v1/me/classes/${classId}/attendance`, {
      method: 'POST',
    }),
  lessonQuestions: (lessonId: string) =>
    req<{ questions: LessonQuestion[] }>(`/api/v1/me/lessons/${lessonId}/questions`),
  questionDetail: (id: string) =>
    req<QuestionDetail>(`/api/v1/me/questions/${id}`),

  // --- Admin: catalog ---
  adminCourses: () => req<{ courses: Course[] }>('/api/v1/admin/courses'),
  createCourse: (input: {
    slug: string;
    title: string;
    description: string;
    level: string;
    status: string;
    learningOutcomes?: string[];
  }) =>
    req<{ course: Course }>('/api/v1/admin/courses', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  publishCourse: (id: string) =>
    req<{ course: Course }>(`/api/v1/admin/courses/${id}/publish`, { method: 'POST' }),
  createBatch: (input: {
    courseId: string;
    code: string;
    name: string;
    startAt: string;
    endAt: string;
    capacity: number;
    timezone: string;
    status: string;
  }) =>
    req<{ batch: Batch }>('/api/v1/admin/batches', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  enrollUser: (batchId: string, input: { userId: string; state: string }) =>
    req<{ enrollment: Enrollment }>(`/api/v1/admin/batches/${batchId}/enrollments`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // --- Admin: curriculum ---
  createModule: (courseId: string, input: { sequence: number; title: string; description?: string }) =>
    req<unknown>(`/api/v1/admin/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  publishModule: (moduleId: string) =>
    req<unknown>(`/api/v1/admin/modules/${moduleId}/publish`, { method: 'POST' }),
  createLesson: (
    moduleId: string,
    input: { sequence: number; title: string; type: string; durationSeconds?: number }
  ) =>
    req<unknown>(`/api/v1/admin/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  publishLesson: (lessonId: string) =>
    req<unknown>(`/api/v1/admin/lessons/${lessonId}/publish`, { method: 'POST' }),
  createResource: (
    lessonId: string,
    input: { sequence: number; title: string; resourceUrl: string; contentType: string }
  ) =>
    req<unknown>(`/api/v1/admin/lessons/${lessonId}/resources`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  createPrerequisite: (lessonId: string, prerequisiteLessonId: string) =>
    req<unknown>(`/api/v1/admin/lessons/${lessonId}/prerequisites`, {
      method: 'POST',
      body: JSON.stringify({ prerequisiteLessonId }),
    }),
  adminCurriculum: (courseId: string) =>
    req<unknown>(`/api/v1/admin/courses/${courseId}/curriculum`),

  // --- Admin: live ---
  createClass: (
    batchId: string,
    input: { title: string; provider: string; meetingUrl?: string; scheduledAt: string; endsAt: string; status: string }
  ) =>
    req<unknown>(`/api/v1/admin/batches/${batchId}/classes`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  quickClass: (
    batchId: string,
    input: {
      topicTitle: string;
      classTitle: string;
      provider: string;
      scheduledAt: string;
      endsAt: string;
      questions: { slug: string; title: string; externalUrl?: string }[];
    }
  ) =>
    req<unknown>(`/api/v1/admin/batches/${batchId}/quick-class`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  patchClass: (classId: string, input: { recordingUrl?: string; status?: string }) =>
    req<unknown>(`/api/v1/admin/classes/${classId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  // --- Admin: questions ---
  createQuestion: (input: {
    slug: string;
    title: string;
    topic: string;
    difficulty: string;
    externalUrl?: string;
    status: string;
  }) =>
    req<unknown>('/api/v1/admin/questions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  linkQuestion: (lessonId: string, input: { questionId: string; sequence: number }) =>
    req<unknown>(`/api/v1/admin/lessons/${lessonId}/questions`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  createVersion: (questionId: string, input: Record<string, unknown>) =>
    req<unknown>(`/api/v1/admin/questions/${questionId}/versions`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  createTestcase: (versionId: string, input: Record<string, unknown>) =>
    req<unknown>(`/api/v1/admin/versions/${versionId}/testcases`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // --- Admin: announcements ---
  createAnnouncement: (input: { batchId?: string; courseId?: string; title: string; body: string }) =>
    req<{ announcement: Announcement }>('/api/v1/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

export function normalizeCatalog(data: Course[] | { courses: Course[] }): Course[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as { courses: Course[] }).courses))
    return (data as { courses: Course[] }).courses;
  return [];
}

export function normalizeDetail(
  data: CourseDetail | { course: Course; batches: Batch[] }
): CourseDetail {
  return data as CourseDetail;
}

export type {
  Announcement,
  Batch,
  Course,
  CourseDetail,
  CurriculumEntry,
  Enrollment,
  LessonDetail,
  LessonQuestion,
  LiveClass,
  Progress,
  QuestionDetail,
  QuestionSample,
  Recording,
  User,
};
