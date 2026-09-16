// Mirrors backend contracts in FRONTEND_BUILD_SPEC.md §0 exactly.
// Verified live 2026-09-13. No durationWeeks, no startsAt — backend uses
// estimatedDurationHours and startAt/endAt, batch uses name (not title).

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

// --- Public catalog ---
export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedDurationHours?: number | null;
  coverImageUrl?: string | null;
  learningOutcomes: string[];
  publishedAt?: string | null;
  status?: 'draft' | 'published' | 'archived';
  openBatchCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Batch {
  id: string;
  code: string;
  name: string;
  startAt: string;
  endAt: string;
  capacity: number;
  timezone: string;
  tuitionAmountMinor: number;
  currency: string;
  enrollmentOpensAt?: string | null;
  enrollmentClosesAt?: string | null;
  reservedSeats: number;
  availableSeats: number;
}

export interface CourseDetail {
  course: Course;
  batches: Batch[];
}

// --- Student: enrollments ---
export interface Enrollment {
  id: string;
  state: 'pending' | 'active' | 'revoked' | 'completed';
  activatedAt?: string | null;
  accessExpiresAt: string;
  createdAt?: string;
  batchId: string;
  batchCode: string;
  batchName: string;
  batchStartAt: string;
  batchEndAt: string;
  timezone?: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
}

// --- Student: curriculum ---
export interface CurriculumLesson {
  id: string;
  sequence: number;
  title: string;
  description?: string | null;
  type: string;
  durationSeconds?: number | null;
  watchedSeconds: number;
  completedAt?: string | null;
  locked: boolean;
}

export interface CurriculumModule {
  id: string;
  sequence: number;
  title: string;
  description?: string | null;
  lessons: CurriculumLesson[];
}

export interface CurriculumEntry {
  enrollmentId: string;
  course: { id: string; slug: string; title: string };
  modules: CurriculumModule[];
}

// --- Student: lesson detail ---
export interface LessonResource {
  id: string;
  sequence: number;
  title: string;
  resourceUrl: string;
  contentType: string;
}

export interface LessonDetail {
  enrollmentId: string;
  id: string;
  title: string;
  description?: string | null;
  type: string;
  videoProviderId?: string | null;
  durationSeconds?: number | null;
  watchedSeconds: number;
  completedAt?: string | null;
  locked: boolean;
  resources: LessonResource[];
}

// --- Student: live / recordings ---
export interface LiveClass {
  id: string;
  title: string;
  provider: string;
  meetingUrl?: string | null;
  scheduledAt: string;
  endsAt: string;
  status: string;
  batchName: string;
  courseTitle: string;
}

export interface Recording {
  classId: string;
  title: string;
  recordingUrl: string;
  scheduledAt: string;
  batchName: string;
  accessExpiresAt: string;
}

// --- Student: questions ---
export interface LessonQuestion {
  id: string;
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  externalUrl?: string | null;
  sequence: number;
}

export interface QuestionSample {
  id: string;
  stdin: string;
  expected: string;
}

export interface QuestionDetail {
  question: Record<string, unknown>;
  samples: QuestionSample[];
}

// --- Student: announcements / progress ---
export interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
}

export interface Progress {
  topic: string;
  totalLessons: number;
  completedLessons: number;
  attendedLives: number;
}

// --- Admin ---
export interface AdminCourse extends Course {
  status: 'draft' | 'published' | 'archived';
}

// --- Tolerant getters (backend naming variants) ---
// deno-lint-ignore no-explicit-any
export function batchTitle(b: any): string {
  return b?.title ?? b?.name ?? b?.code ?? '';
}

// deno-lint-ignore no-explicit-any
export function batchStart(b: any): string {
  return b?.startsAt ?? b?.startAt ?? b?.batchStartAt ?? '';
}

// deno-lint-ignore no-explicit-any
export function batchEnd(b: any): string {
  return b?.endsAt ?? b?.endAt ?? b?.batchEndAt ?? '';
}

// deno-lint-ignore no-explicit-any
export function courseDurationLabel(c: any): string {
  if (c?.durationWeeks != null) return `${c.durationWeeks} weeks`;
  if (c?.estimatedDurationHours != null) return `${c.estimatedDurationHours}h`;
  return 'Self-paced';
}
