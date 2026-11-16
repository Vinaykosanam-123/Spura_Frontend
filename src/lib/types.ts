// Types aligned with the SPURA Fastify backend (/Users/vinay/Desktop/Development/learnandlearn).

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  status?: 'active' | 'suspended' | 'deleted' | string;
  emailVerifiedAt?: string | null;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string | null;
  level: 'beginner' | 'intermediate' | 'advanced' | string;
  estimatedDurationHours?: number | null;
  durationWeeks?: number | null;
  coverImageUrl?: string | null;
  learningOutcomes?: string[];
  status?: 'draft' | 'published' | 'archived' | string;
  publishedAt?: string | null;
  openBatchCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Batch {
  id: string;
  courseId?: string;
  courseTitle?: string;
  code: string;
  name?: string;
  title?: string;
  startAt?: string;
  startsAt?: string;
  endAt?: string;
  endsAt?: string;
  capacity: number;
  timezone: string;
  tuitionAmountMinor: number;
  currency: string;
  enrollmentOpensAt?: string | null;
  enrollmentClosesAt?: string | null;
  status?: 'draft' | 'open' | 'closed' | 'completed' | 'cancelled' | string;
  reservedSeats: number;
  availableSeats: number;
}

export interface PricingPlan {
  id: string;
  courseId: string;
  batchId: string | null;
  amountMinor: number;
  currency: string;
  accessMonthsDefault: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchInstructor {
  userId?: string;
  id?: string;
  email: string;
  fullName: string;
  assignedAt: string;
}

export function batchTitle(b: Batch): string {
  return b.name ?? b.title ?? b.code;
}
export function batchStart(b: Batch): string | undefined {
  return b.startAt ?? b.startsAt;
}
export function batchEnd(b: Batch): string | undefined {
  return b.endAt ?? b.endsAt;
}

export interface CourseDetail {
  course: Course;
  batches: Batch[];
  pricingPlans?: PricingPlan[];
}

export interface Enrollment {
  id: string;
  userId?: string;
  email?: string;
  fullName?: string;
  state: 'pending' | 'active' | 'cancelled' | 'revoked' | 'completed';
  activatedAt: string | null;
  cancelledAt?: string | null;
  accessExpiresAt: string;
  createdAt: string;
  updatedAt?: string;
  batchId: string;
  batchCode?: string;
  batchName?: string;
  batchTitle?: string;
  batchStartAt?: string;
  batchStartsAt?: string;
  batchEndAt?: string;
  batchEndsAt?: string;
  timezone?: string;
  courseId?: string;
  courseSlug?: string;
  courseTitle?: string;
}

export interface CurriculumLesson {
  id: string;
  sequence: number;
  title: string;
  description: string | null;
  type: 'video' | 'article' | 'live_session' | string;
  durationSeconds: number | null;
  watchedSeconds: number;
  completedAt: string | null;
  locked: boolean;
  status?: 'draft' | 'published' | 'archived' | string;
}

export interface CurriculumModule {
  id: string;
  sequence: number;
  title: string;
  description: string | null;
  status?: 'draft' | 'published' | 'archived' | string;
  lessons: CurriculumLesson[];
}

export interface CurriculumEntry {
  enrollmentId: string;
  course: { id: string; slug: string; title: string; description?: string | null; status?: string };
  modules: CurriculumModule[];
}

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
  description: string | null;
  type: string;
  videoProviderId: string | null;
  durationSeconds: number | null;
  watchedSeconds: number;
  completedAt: string | null;
  locked: boolean;
  resources: LessonResource[];
}

export interface LessonQuestion {
  id: string;
  slug: string;
  title: string;
  topic: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | string | null;
  externalUrl: string | null;
  sequence: number;
}

export interface LiveClass {
  id: string;
  batchId?: string;
  lessonId?: string | null;
  title: string;
  provider: string;
  meetingUrl: string | null;
  recordingUrl?: string | null;
  scheduledAt: string;
  endsAt: string;
  status: string;
  batchName?: string;
  courseTitle?: string;
}

export interface ClassAttendance {
  classId: string;
  enrollmentId: string;
  userId: string;
  email: string;
  fullName: string;
  joinedAt: string;
  leftAt: string | null;
}

export interface Recording {
  classId: string;
  title: string;
  recordingUrl: string;
  scheduledAt: string;
  batchName: string;
  accessExpiresAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  batchId: string | null;
  courseId?: string | null;
  publishedAt: string;
}

export interface TopicProgress {
  topic: string;
  totalLessons: number;
  completedLessons: number;
  attendedLives: number;
}

export type Progress = TopicProgress;

export interface QuestionSample {
  id: string;
  stdin: string;
  expected: string;
}

export interface QuestionVersion {
  id: string;
  statement: string;
  constraintsText: string | null;
  timeLimitMs: number;
  memoryLimitKb: number;
}

export interface QuestionDetail {
  question: {
    id: string;
    slug: string;
    title: string;
    topic: string | null;
    difficulty: string | null;
    statement: string | null;
    externalUrl?: string | null;
    version: QuestionVersion | null;
  };
  samples: QuestionSample[];
}

export type CodeLanguage = 'cpp' | 'python' | 'java' | 'javascript';

export interface RunResult {
  testCaseId?: string;
  stdin: string;
  expected: string;
  stdout?: string;
  actual?: string;
  stderr?: string | null;
  passed: boolean;
  verdict?: string;
  runtimeMs?: number;
  memoryKb?: number;
  exitCode?: number | null;
}

export interface RunJobResponse {
  jobId?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed' | string;
  results: RunResult[];
  allPassed: boolean;
  errorMessage?: string | null;
}

export interface Submission {
  id: string;
  questionId?: string;
  language: CodeLanguage;
  status: 'queued' | 'running' | 'completed' | 'failed' | string;
  verdict: string | null;
  score: number | null;
  runtimeMs: number | null;
  memoryKb?: number | null;
  createdAt: string;
  updatedAt?: string;
  questionTitle?: string;
  questionSlug?: string;
  evaluationVerdict?: string | null;
  testsPassed?: number | null;
  testsTotal?: number | null;
  testCaseResults?: Array<{
    testCaseId: string;
    isSample: boolean;
    weight: number;
    verdict: string;
    runtimeMs: number | null;
  }>;
}

export interface CodeAnalysis {
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  betterApproach: string | null;
  [k: string]: unknown;
}

export interface PaymentOrder {
  id: string;
  batchId: string | null;
  planId: string | null;
  providerOrderId: string;
  amountMinor: number;
  currency: string;
  state: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CheckoutSession {
  provider: string;
  orderId?: string;
  providerOrderId: string;
  keyId?: string | null;
  amountMinor: number;
  currency: string;
  checkoutUrl?: string | null;
  options?: Record<string, unknown>;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  userId?: string;
  userEmail?: string;
  enrollmentId: string | null;
  amountMinor: number;
  taxAmountMinor: number;
  currency: string;
  status: string;
  issuedAt: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Refund {
  id: string;
  orderId: string;
  userId?: string;
  userEmail?: string;
  transactionId?: string | null;
  providerRefundId: string | null;
  amountMinor: number;
  currency: string;
  reason: string;
  status: string;
  processedBy?: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  userEmail?: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  status: string;
  isRead?: boolean;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
  attemptCount?: number;
  jobState?: string | null;
  lastError?: string | null;
}

export interface FeedbackItem {
  id: string;
  userId?: string;
  category: string;
  message: string;
  status?: 'open' | 'under_review' | 'resolved' | 'closed' | string;
  adminResponse?: string | null;
  respondedBy?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  email?: string;
  fullName?: string;
}
