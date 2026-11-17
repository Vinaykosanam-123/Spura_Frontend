// Client-side fetch helper for SPURA API (http://localhost:4000).
// Sends HTTP-only session cookie via credentials: 'include' and parses standard ErrorEnvelope.

import type {
  Announcement,
  Batch,
  BatchInstructor,
  CheckoutSession,
  ClassAttendance,
  CodeAnalysis,
  CodeLanguage,
  Course,
  CourseDetail,
  CurriculumEntry,
  Enrollment,
  FeedbackItem,
  Invoice,
  LessonDetail,
  LessonQuestion,
  LessonResource,
  LiveClass,
  NotificationItem,
  PaymentOrder,
  PricingPlan,
  QuestionDetail,
  Recording,
  Refund,
  RunJobResponse,
  Submission,
  TopicProgress,
  User,
} from './types';
import { CLIENT_API_BASE_URL, isDevBypassEnabled } from './config';
import { mockResponse } from './mock';

export const API_URL = CLIENT_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string[]>;
  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string[]>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (isDevBypassEnabled()) return mockResponse(path, init.method ?? 'GET', init.body) as T;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (init.body && !headers['content-type']) {
    headers['content-type'] = 'application/json';
  }
  const url = typeof window !== 'undefined' && path.startsWith('/api/') ? path : `${API_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(20_000),
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body.code ?? 'ERROR',
      body.message ?? `Request failed (${res.status})`,
      body.fields?.fieldErrors ?? body.fields,
    );
  }
  return body as T;
}

export function normalizeCatalog(data: { courses?: Course[] } | Course[] | null | undefined): Course[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.courses)) return data.courses;
  return [];
}

export const api = {
  // ── Auth & Session Management ──
  register: (
    fullNameOrData: string | { fullName: string; email: string; password: string },
    email?: string,
    password?: string,
  ) =>
    req<{ user: User }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(
        typeof fullNameOrData === 'string'
          ? { fullName: fullNameOrData, email: email ?? '', password: password ?? '' }
          : fullNameOrData,
      ),
    }),
  login: (
    emailOrData: string | { email: string; password: string },
    password?: string,
  ) =>
    req<{ user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(
        typeof emailOrData === 'string'
          ? { email: emailOrData, password: password ?? '' }
          : emailOrData,
      ),
    }),
  logout: () => req<void>('/api/v1/auth/logout', { method: 'POST' }),
  logoutAll: () => req<void>('/api/v1/auth/logout-all', { method: 'POST' }),
  me: () => req<{ user: User }>('/api/v1/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    req<{ message: string; revokedSessionsCount: number }>(
      '/api/v1/auth/password/change',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  requestVerifyEmail: (email: string) =>
    req<{ message: string }>('/api/v1/auth/verify-email/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  confirmVerifyEmail: (data: { email: string; token: string }) =>
    req<{ message: string }>('/api/v1/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  requestPasswordReset: (email: string) =>
    req<{ message: string }>('/api/v1/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  confirmPasswordReset: (data: {
    email: string;
    token: string;
    password: string;
  }) =>
    req<{ message: string }>('/api/v1/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── User Profile ──
  profile: () => req<{ user: User }>('/api/v1/me'),
  updateProfile: (data: { fullName?: string; phone?: string | null }) =>
    req<{ user: User }>('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // ── Public Catalog ──
  catalog: () => req<{ courses: Course[] }>('/api/v1/catalog/courses'),
  courses: () => req<{ courses: Course[] }>('/api/v1/catalog/courses'),
  courseDetail: (slug: string) =>
    req<CourseDetail>(`/api/v1/catalog/courses/${encodeURIComponent(slug)}`),

  // ── Student Learning, Live & Progress ──
  enrollments: () => req<{ enrollments: Enrollment[] }>('/api/v1/me/enrollments'),
  curriculum: () => req<{ curriculum: CurriculumEntry[] }>('/api/v1/me/curriculum'),
  lessonDetail: (id: string) =>
    req<{ lesson: LessonDetail }>(`/api/v1/me/lessons/${encodeURIComponent(id)}`),
  lessonResources: (id: string) =>
    req<{ resources: LessonResource[] }>(`/api/v1/me/lessons/${encodeURIComponent(id)}/resources`),
  lessonQuestions: (id: string) =>
    req<{ questions: LessonQuestion[] }>(`/api/v1/me/lessons/${encodeURIComponent(id)}/questions`),
  saveProgress: (id: string, watchedSeconds: number) =>
    req<{
      progress: {
        lessonId: string;
        watchedSeconds: number;
        completedAt: string | null;
        updatedAt: string;
      };
    }>(`/api/v1/me/lessons/${encodeURIComponent(id)}/progress`, {
      method: 'POST',
      body: JSON.stringify({ watchedSeconds }),
    }),
  completeLesson: (id: string) =>
    req<{
      progress: {
        lessonId: string;
        watchedSeconds: number;
        completedAt: string;
        updatedAt: string;
      };
    }>(`/api/v1/me/lessons/${encodeURIComponent(id)}/complete`, { method: 'POST' }),
  upcoming: () => req<{ live: LiveClass[] }>('/api/v1/me/live/upcoming'),
  liveUpcoming: () => req<{ live: LiveClass[] }>('/api/v1/me/live/upcoming'),
  recordings: () => req<{ recordings: Recording[] }>('/api/v1/me/recordings'),
  recordingDetail: (classId: string) =>
    req<{ recording: Recording }>(`/api/v1/me/recordings/${encodeURIComponent(classId)}`),
  announcements: () =>
    req<{ announcements: Announcement[] }>('/api/v1/me/announcements'),
  progress: () => req<{ progress: TopicProgress[] }>('/api/v1/me/progress'),
  attendance: (classId: string) =>
    req<{ attended: boolean }>(`/api/v1/me/classes/${encodeURIComponent(classId)}/attendance`, {
      method: 'POST',
    }),
  attend: (classId: string) =>
    req<{ attended: boolean }>(`/api/v1/me/classes/${encodeURIComponent(classId)}/attendance`, {
      method: 'POST',
    }),
  questionDetail: (id: string) =>
    req<QuestionDetail>(`/api/v1/me/questions/${encodeURIComponent(id)}`),

  // ── Code Execution, Submissions & Analysis ──
  runQuestion: (
    questionId: string,
    data: { language: string; sourceCode: string; stdin?: string },
  ) =>
    req<RunJobResponse>(`/api/v1/me/questions/${encodeURIComponent(questionId)}/run`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  runCode: (
    questionId: string,
    data: { language: CodeLanguage; sourceCode: string; stdin?: string },
  ) =>
    req<RunJobResponse>(`/api/v1/me/questions/${encodeURIComponent(questionId)}/run`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  runJob: (runJobId: string) =>
    req<RunJobResponse>(`/api/v1/me/run-jobs/${encodeURIComponent(runJobId)}`),
  submitQuestion: (
    questionId: string,
    data: { language: string; sourceCode: string },
    idempotencyKey: string,
  ) =>
    req<{
      submission: {
        id: string;
        status: string;
        verdict?: string | null;
        createdAt?: string;
      };
    }>(`/api/v1/me/questions/${encodeURIComponent(questionId)}/submit`, {
      method: 'POST',
      headers: { 'idempotency-key': idempotencyKey },
      body: JSON.stringify(data),
    }),
  submitCode: (
    questionId: string,
    data: { language: CodeLanguage; sourceCode: string },
    idempotencyKey: string,
  ) =>
    req<{
      submission: {
        id: string;
        status: string;
        verdict?: string | null;
        createdAt?: string;
      };
    }>(`/api/v1/me/questions/${encodeURIComponent(questionId)}/submit`, {
      method: 'POST',
      headers: { 'idempotency-key': idempotencyKey },
      body: JSON.stringify(data),
    }),
  submissionDetail: (id: string) =>
    req<{ submission: Submission }>(`/api/v1/me/submissions/${encodeURIComponent(id)}`),
  submissions: (questionId?: string, cursor?: string) => {
    const sp = new URLSearchParams();
    if (questionId) sp.set('questionId', questionId);
    if (cursor) sp.set('cursor', cursor);
    const qs = sp.toString();
    return req<{ submissions: Submission[]; nextCursor: string | null }>(
      `/api/v1/me/submissions${qs ? `?${qs}` : ''}`,
    );
  },
  analyzeQuestion: (
    questionId: string,
    data: { language: string; sourceCode: string },
  ) =>
    req<{
      analysis: {
        timeComplexity: string;
        spaceComplexity: string;
        explanation: string;
        betterApproach: {
          title: string;
          timeComplexity: string;
          spaceComplexity: string;
          hint: string;
        } | null;
      };
    }>(`/api/v1/me/questions/${encodeURIComponent(questionId)}/analyze`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  analyzeCode: (
    questionId: string,
    data: { language: CodeLanguage; sourceCode: string },
  ) =>
    req<{ analysis: CodeAnalysis }>(`/api/v1/me/questions/${encodeURIComponent(questionId)}/analyze`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Payments, Orders, Invoices & Refunds ──
  createOrder: (data: {
    batchId: string;
    planId?: string;
    idempotencyKey?: string;
  }) =>
    req<{ order: PaymentOrder }>('/api/v1/payments/orders', {
      method: 'POST',
      body: JSON.stringify({
        batchId: data.batchId,
        ...(data.planId ? { planId: data.planId } : {}),
        idempotencyKey:
          data.idempotencyKey ??
          (typeof crypto !== 'undefined' && crypto.randomUUID
            ? `ord-${crypto.randomUUID()}`
            : `ord-${data.batchId}-${Date.now()}`),
      }),
    }),
  getOrder: (orderId: string) =>
    req<{ order: PaymentOrder }>(`/api/v1/payments/orders/${encodeURIComponent(orderId)}`),
  myOrders: () => req<{ orders: PaymentOrder[] }>('/api/v1/me/orders'),
  checkoutOrder: (orderId: string) =>
    req<CheckoutSession>(`/api/v1/payments/orders/${encodeURIComponent(orderId)}/checkout`, {
      method: 'POST',
    }),
  sandboxCompleteOrder: (orderId: string) =>
    req<{ outcome: unknown }>(`/api/v1/payments/orders/${encodeURIComponent(orderId)}/sandbox-complete`, {
      method: 'POST',
    }),
  myInvoices: () => req<{ invoices: Invoice[] }>('/api/v1/me/invoices'),
  myInvoiceDetail: (invoiceId: string) =>
    req<{ invoice: Invoice }>(`/api/v1/me/invoices/${encodeURIComponent(invoiceId)}`),
  myRefunds: () => req<{ refunds: Refund[] }>('/api/v1/me/refunds'),

  // ── Notifications ──
  myNotifications: (params?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.unreadOnly !== undefined)
      sp.set('unreadOnly', String(params.unreadOnly));
    if (params?.limit !== undefined) sp.set('limit', String(params.limit));
    if (params?.offset !== undefined) sp.set('offset', String(params.offset));
    const qs = sp.toString();
    return req<{ notifications: NotificationItem[]; unreadCount: number }>(
      `/api/v1/me/notifications${qs ? `?${qs}` : ''}`,
    );
  },
  markNotificationRead: (notificationId: string) =>
    req<{ notification: NotificationItem }>(
      `/api/v1/me/notifications/${encodeURIComponent(notificationId)}/read`,
      { method: 'PATCH' },
    ),
  markAllNotificationsRead: () =>
    req<{ updatedCount: number }>('/api/v1/me/notifications/read-all', {
      method: 'POST',
    }),
  adminNotifications: (params?: {
    userId?: string;
    status?: 'pending' | 'delivered' | 'failed';
    type?: string;
    limit?: number;
    offset?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.userId) sp.set('userId', params.userId);
    if (params?.status) sp.set('status', params.status);
    if (params?.type) sp.set('type', params.type);
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    const qs = sp.toString();
    return req<{ notifications: NotificationItem[] }>(
      `/api/v1/admin/notifications${qs ? `?${qs}` : ''}`,
    );
  },

  // ── Admin: Users & RBAC ──
  adminUsers: (params?: {
    q?: string;
    role?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set('q', params.q);
    if (params?.role) sp.set('role', params.role);
    if (params?.status) sp.set('status', params.status);
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    const qs = sp.toString();
    return req<{ users: User[] }>(`/api/v1/admin/users${qs ? `?${qs}` : ''}`);
  },
  adminUserDetail: (userId: string) =>
    req<{ user: User; enrollments: Enrollment[] }>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}`,
    ),
  adminCreateUser: (data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    status?: 'active' | 'suspended';
    roles?: string[];
  }) =>
    req<{ user: User }>('/api/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adminUpdateUserStatus: (
    userId: string,
    data: { status: 'active' | 'suspended' | 'deleted'; reason?: string },
  ) =>
    req<{ user: User; revokedSessionsCount: number }>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  adminUpdateUserRoles: (userId: string, roles: string[]) =>
    req<{ user: User }>(`/api/v1/admin/users/${encodeURIComponent(userId)}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roles }),
    }),

  // ── Admin: Courses & Pricing Plans ──
  adminCourses: () => req<{ courses: Course[] }>('/api/v1/admin/courses'),
  adminCourseDetail: (courseId: string) =>
    req<{ course: Course; batches: Batch[]; pricingPlans: PricingPlan[] }>(
      `/api/v1/admin/courses/${encodeURIComponent(courseId)}`,
    ),
  createCourse: (data: {
    slug: string;
    title: string;
    subtitle?: string;
    description?: string;
    level?: string;
    estimatedDurationHours?: number;
    status?: string;
  }) =>
    req<{ course: Course }>('/api/v1/admin/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCourse: (
    courseId: string,
    data: Partial<{
      slug: string;
      title: string;
      subtitle: string | null;
      description: string | null;
      level: string;
      estimatedDurationHours: number | null;
      coverImageUrl: string | null;
      learningOutcomes: string[];
    }>,
  ) =>
    req<{ course: Course }>(`/api/v1/admin/courses/${encodeURIComponent(courseId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  publishCourse: (id: string) =>
    req<{ course: Course }>(`/api/v1/admin/courses/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
    }),
  archiveCourse: (id: string) =>
    req<{ course: Course }>(`/api/v1/admin/courses/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
    }),
  adminPricingPlans: (courseId: string) =>
    req<{ pricingPlans: PricingPlan[] }>(
      `/api/v1/admin/courses/${encodeURIComponent(courseId)}/pricing-plans`,
    ),
  createPricingPlan: (
    courseId: string,
    data: {
      batchId?: string;
      amountMinor: number;
      currency?: string;
      accessMonthsDefault?: number;
      active?: boolean;
    },
  ) =>
    req<{ pricingPlan: PricingPlan }>(
      `/api/v1/admin/courses/${encodeURIComponent(courseId)}/pricing-plans`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  updatePricingPlan: (
    planId: string,
    data: Partial<{
      amountMinor: number;
      currency: string;
      accessMonthsDefault: number;
      active: boolean;
    }>,
  ) =>
    req<{ pricingPlan: PricingPlan }>(`/api/v1/admin/pricing-plans/${encodeURIComponent(planId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // ── Admin: Batches, Instructors & Enrollments ──
  adminBatches: (params?: { courseId?: string; status?: string }) => {
    const sp = new URLSearchParams();
    if (params?.courseId) sp.set('courseId', params.courseId);
    if (params?.status) sp.set('status', params.status);
    const qs = sp.toString();
    return req<{ batches: Batch[] }>(`/api/v1/admin/batches${qs ? `?${qs}` : ''}`);
  },
  adminBatchDetail: (batchId: string) =>
    req<{ batch: Batch; instructors: BatchInstructor[] }>(
      `/api/v1/admin/batches/${encodeURIComponent(batchId)}`,
    ),
  createBatch: (data: {
    courseId: string;
    code: string;
    name: string;
    startAt: string;
    endAt: string;
    capacity: number;
    timezone?: string;
    tuitionAmountMinor?: number;
    currency?: string;
    status?: string;
  }) =>
    req<{ batch: Batch }>('/api/v1/admin/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBatch: (
    batchId: string,
    data: Partial<{
      code: string;
      name: string;
      startAt: string;
      endAt: string;
      capacity: number;
      timezone: string;
      tuitionAmountMinor: number;
      currency: string;
      status: string;
    }>,
  ) =>
    req<{ batch: Batch }>(`/api/v1/admin/batches/${encodeURIComponent(batchId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  batchInstructors: (batchId: string) =>
    req<{ instructors: BatchInstructor[] }>(
      `/api/v1/admin/batches/${encodeURIComponent(batchId)}/instructors`,
    ),
  assignBatchInstructor: (batchId: string, userId: string) =>
    req<{
      assignment: {
        batchId: string;
        userId: string;
        email: string;
        fullName: string;
      };
    }>(`/api/v1/admin/batches/${encodeURIComponent(batchId)}/instructors`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  removeBatchInstructor: (batchId: string, userId: string) =>
    req<void>(`/api/v1/admin/batches/${encodeURIComponent(batchId)}/instructors/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    }),
  enrollUser: (batchId: string, data: { userId: string; state?: string; accessExpiresAt?: string }) =>
    req<{ enrollment: Enrollment }>(
      `/api/v1/admin/batches/${encodeURIComponent(batchId)}/enrollments`,
      { method: 'POST', body: JSON.stringify(data) },
    ),
  batchEnrollments: (batchId: string) =>
    req<{ enrollments: Enrollment[] }>(
      `/api/v1/admin/batches/${encodeURIComponent(batchId)}/enrollments`,
    ),
  adminEnrollments: (params?: {
    userId?: string;
    batchId?: string;
    state?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params?.userId) sp.set('userId', params.userId);
    if (params?.batchId) sp.set('batchId', params.batchId);
    if (params?.state) sp.set('state', params.state);
    const qs = sp.toString();
    return req<{ enrollments: Enrollment[] }>(
      `/api/v1/admin/enrollments${qs ? `?${qs}` : ''}`,
    );
  },
  updateEnrollment: (
    enrollmentId: string,
    data: {
      state?: 'pending' | 'active' | 'cancelled' | 'completed';
      accessExpiresAt?: string;
    },
  ) =>
    req<{ enrollment: Enrollment }>(`/api/v1/admin/enrollments/${encodeURIComponent(enrollmentId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // ── Admin: Curriculum ──
  adminCurriculum: (courseId: string) =>
    req<CurriculumEntry>(`/api/v1/admin/courses/${encodeURIComponent(courseId)}/curriculum`),
  createModule: (
    courseId: string,
    data: { sequence: number; title: string; description?: string },
  ) =>
    req(`/api/v1/admin/courses/${encodeURIComponent(courseId)}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateModule: (
    moduleId: string,
    data: Partial<{
      sequence: number;
      title: string;
      description: string | null;
      status: 'draft' | 'published' | 'archived';
    }>,
  ) =>
    req(`/api/v1/admin/modules/${encodeURIComponent(moduleId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  publishModule: (moduleId: string) =>
    req(`/api/v1/admin/modules/${encodeURIComponent(moduleId)}/publish`, { method: 'POST' }),
  createLesson: (
    moduleId: string,
    data: {
      sequence: number;
      title: string;
      description?: string;
      type?: 'video' | 'article' | 'live_session' | string;
      durationSeconds?: number;
    },
  ) =>
    req(`/api/v1/admin/modules/${encodeURIComponent(moduleId)}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLesson: (
    lessonId: string,
    data: Partial<{
      sequence: number;
      title: string;
      description: string | null;
      type: 'video' | 'article' | 'live_session';
      durationSeconds: number | null;
      status: 'draft' | 'published' | 'archived';
    }>,
  ) =>
    req(`/api/v1/admin/lessons/${encodeURIComponent(lessonId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  publishLesson: (lessonId: string) =>
    req(`/api/v1/admin/lessons/${encodeURIComponent(lessonId)}/publish`, { method: 'POST' }),
  createResource: (
    lessonId: string,
    data: {
      sequence: number;
      title: string;
      resourceUrl: string;
      contentType: string;
    },
  ) =>
    req(`/api/v1/admin/lessons/${encodeURIComponent(lessonId)}/resources`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createPrerequisite: (lessonId: string, prerequisiteLessonId: string) =>
    req(`/api/v1/admin/lessons/${encodeURIComponent(lessonId)}/prerequisites`, {
      method: 'POST',
      body: JSON.stringify({ prerequisiteLessonId }),
    }),

  // ── Admin: Live Classes, Recordings, Questions & Announcements ──
  batchClasses: (batchId: string) =>
    req<{ classes: LiveClass[] }>(`/api/v1/admin/batches/${encodeURIComponent(batchId)}/classes`),
  createClass: (
    batchId: string,
    data: {
      title: string;
      provider?: string;
      meetingUrl?: string;
      recordingUrl?: string;
      scheduledAt: string;
      endsAt: string;
      status?: string;
      lessonId?: string;
    },
  ) =>
    req<{ class: LiveClass }>(`/api/v1/admin/batches/${encodeURIComponent(batchId)}/classes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  quickClass: (
    batchId: string,
    data: {
      topicTitle: string;
      classTitle: string;
      description?: string;
      provider?: string;
      meetingUrl?: string;
      recordingUrl?: string;
      scheduledAt: string;
      endsAt: string;
      questions?: Array<{ slug: string; title: string; externalUrl?: string }>;
    },
  ) =>
    req(`/api/v1/admin/batches/${encodeURIComponent(batchId)}/quick-class`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  patchClass: (
    classId: string,
    data: {
      title?: string;
      meetingUrl?: string;
      recordingUrl?: string;
      scheduledAt?: string;
      endsAt?: string;
      status?: string;
    },
  ) =>
    req<{ class: LiveClass }>(`/api/v1/admin/classes/${encodeURIComponent(classId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  classAttendance: (classId: string) =>
    req<{ attendance: ClassAttendance[] }>(
      `/api/v1/admin/classes/${encodeURIComponent(classId)}/attendance`,
    ),
  revokeRecordingAccess: (classId: string, userId: string) =>
    req<{ revoked: boolean }>(
      `/api/v1/admin/classes/${encodeURIComponent(classId)}/recording-access/${encodeURIComponent(userId)}/revoke`,
      { method: 'POST' },
    ),
  createQuestion: (data: {
    slug: string;
    title: string;
    topic?: string;
    difficulty?: string;
    externalUrl?: string;
    status?: string;
  }) =>
    req<{
      question: {
        id: string;
        slug: string;
        title: string;
        topic: string;
        difficulty: string;
        externalUrl: string | null;
        status: string;
      };
    }>('/api/v1/admin/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  linkQuestion: (
    lessonId: string,
    data: { questionId: string; sequence: number },
  ) =>
    req(`/api/v1/admin/lessons/${encodeURIComponent(lessonId)}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createVersion: (
    questionId: string,
    data: {
      statement: string;
      constraintsText?: string;
      timeLimitMs?: number;
      memoryLimitKb?: number;
    },
  ) =>
    req<{ version: { id: string; statement: string; timeLimitMs: number } }>(
      `/api/v1/admin/questions/${encodeURIComponent(questionId)}/versions`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  createTestcase: (
    versionId: string,
    data: {
      stdin?: string;
      expected?: string;
      stdinText?: string;
      expectedStdout?: string;
      isSample?: boolean;
      weight?: number;
    },
  ) =>
    req<{ testcase: { id: string; isSample: boolean } }>(
      `/api/v1/admin/versions/${encodeURIComponent(versionId)}/testcases`,
      {
        method: 'POST',
        body: JSON.stringify({
          stdinText: data.stdinText ?? data.stdin ?? '',
          expectedStdout: data.expectedStdout ?? data.expected ?? '',
          isSample: data.isSample ?? true,
          weight: data.weight ?? 1,
        }),
      },
    ),
  createAnnouncement: (data: {
    batchId?: string;
    courseId?: string;
    title: string;
    body: string;
  }) =>
    req<{ announcement: Announcement }>('/api/v1/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Admin: Commerce (Orders, Invoices & Refunds) ──
  adminOrders: () =>
    req<{
      orders: Array<
        PaymentOrder & {
          userId: string;
          userEmail: string;
          batchCode?: string | null;
        }
      >;
    }>('/api/v1/admin/orders'),
  adminInvoices: () => req<{ invoices: Invoice[] }>('/api/v1/admin/invoices'),
  adminInvoiceDetail: (invoiceId: string) =>
    req<{ invoice: Invoice }>(`/api/v1/admin/invoices/${encodeURIComponent(invoiceId)}`),
  createRefund: (
    orderId: string,
    data: { amountMinor?: number; reason: string; revokeEnrollment?: boolean },
  ) =>
    req<{ refund: Refund }>(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/refunds`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  orderRefunds: (orderId: string) =>
    req<{ refunds: Refund[] }>(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/refunds`),
  adminRefunds: () => req<{ refunds: Refund[] }>('/api/v1/admin/refunds'),

  // ── Company Bank ──
  bankCompanies: (q?: string, limit = 20) =>
    req<{
      companies: Array<{
        id: string;
        slug: string;
        name: string;
        oaCount: number;
        practiceCount: number;
      }>;
    }>(
      `/api/v1/me/bank/companies?limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}`,
    ),
  bankCompanyOa: (
    slug: string,
    params: { format?: string; since?: string; limit?: number } = {},
  ) => {
    const sp = new URLSearchParams();
    if (params.format) sp.set('format', params.format);
    if (params.since) sp.set('since', params.since);
    if (params.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    return req<{
      questions: Array<{
        id: string;
        title: string;
        format: string;
        sourceUrl: string | null;
        askedAt: string | null;
      }>;
    }>(`/api/v1/me/bank/companies/${encodeURIComponent(slug)}/oa${qs ? `?${qs}` : ''}`);
  },
  bankCompanyPractice: (
    slug: string,
    params: { difficulty?: string; limit?: number } = {},
  ) => {
    const sp = new URLSearchParams();
    if (params.difficulty) sp.set('difficulty', params.difficulty);
    if (params.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    return req<{
      questions: Array<{
        id: string;
        slug: string;
        title: string;
        topic: string;
        difficulty: string;
        externalUrl: string | null;
        frequency: number;
        recency: string;
        revisionPriority: string | null;
        notes: string | null;
        hintCount: number;
        companies: Array<{ slug: string; name: string; frequency: number }>;
      }>;
    }>(`/api/v1/me/bank/companies/${encodeURIComponent(slug)}/practice${qs ? `?${qs}` : ''}`);
  },
  bankTop: (difficulty?: string, limit = 30) =>
    req<{
      questions: Array<{
        id: string;
        slug: string;
        title: string;
        topic: string;
        difficulty: string;
        companyCount: number;
      }>;
    }>(
      `/api/v1/me/bank/top?limit=${limit}${difficulty ? `&difficulty=${encodeURIComponent(difficulty)}` : ''}`,
    ),
  bankQuestions: (
    params: {
      q?: string;
      difficulty?: string;
      topic?: string;
      company?: string;
      limit?: number;
    } = {},
  ) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.difficulty) sp.set('difficulty', params.difficulty);
    if (params.topic) sp.set('topic', params.topic);
    if (params.company) sp.set('company', params.company);
    if (params.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    return req<{
      questions: Array<{
        id: string;
        slug: string;
        title: string;
        topic: string;
        difficulty: string;
        solved: boolean;
        acceptance: number | null;
        maxFrequency: number;
        companies: Array<{ slug: string; name: string; frequency: number }>;
      }>;
    }>(`/api/v1/me/bank/questions${qs ? `?${qs}` : ''}`);
  },
  bankQuestionDetail: (id: string) =>
    req<{
      question: {
        id: string;
        slug: string;
        title: string;
        topic: string;
        difficulty: string;
        externalUrl: string | null;
        leetcodeId: number | null;
        acceptance: number | null;
        pattern: string | null;
        statement: string | null;
        constraints: string | null;
      };
      samples: Array<{ stdin: string; expected: string }>;
      hints: Array<{ sequence: number; hint: string }>;
      companies: Array<{
        slug: string;
        name: string;
        frequency: number;
        recency: string;
        notes: string | null;
      }>;
    }>(`/api/v1/me/bank/questions/${encodeURIComponent(id)}`),

  // ── Mocks, Contests & Feedback ──
  createMock: (data: {
    companySlug?: string;
    difficulty: string;
    durationMinutes: number;
  }) =>
    req<{
      assessment: {
        id: string;
        difficulty: string;
        durationMinutes: number;
        startedAt: string;
        endsAt: string;
        status: string;
        questions: Array<{
          id: string;
          slug: string;
          title: string;
          topic: string;
          difficulty: string;
        }>;
      };
    }>('/api/v1/me/mocks', { method: 'POST', body: JSON.stringify(data) }),
  mocks: () =>
    req<{
      mocks: Array<{
        id: string;
        difficulty: string;
        durationMinutes: number;
        status: string;
        score: number | null;
        total: number;
        startedAt: string;
        endsAt: string;
        companySlug: string | null;
        companyName: string | null;
      }>;
    }>('/api/v1/me/mocks'),
  mockDetail: (id: string) =>
    req<{
      assessment: {
        id: string;
        difficulty: string;
        durationMinutes: number;
        status: string;
        score: number | null;
        startedAt: string;
        endsAt: string;
        companySlug: string | null;
        companyName: string | null;
        questions: Array<{
          id: string;
          slug: string;
          title: string;
          topic: string;
          difficulty: string;
          solved: boolean;
        }>;
      };
    }>(`/api/v1/me/mocks/${encodeURIComponent(id)}`),
  contests: () =>
    req<{
      contests: Array<{
        id: string;
        title: string;
        difficulty: string;
        durationMinutes: number;
        startsAt: string;
        endsAt: string;
        state: string;
        total: number;
        companySlug: string | null;
        companyName: string | null;
        joined?: boolean;
        myScore: number | null;
      }>;
    }>('/api/v1/me/contests'),
  adminContests: () =>
    req<{
      contests: Array<{
        id: string;
        title: string;
        difficulty: string;
        durationMinutes: number;
        startsAt: string;
        endsAt: string;
        state: string;
        total: number;
        companySlug: string | null;
        companyName: string | null;
        participantCount?: number;
      }>;
    }>('/api/v1/admin/contests'),
  deleteContest: (id: string) =>
    req<{ deleted: boolean; id: string }>(`/api/v1/admin/contests/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  joinContest: (id: string) =>
    req<{ joined: boolean }>(`/api/v1/me/contests/${encodeURIComponent(id)}/join`, {
      method: 'POST',
    }),
  contestDetail: (id: string) =>
    req<{
      contest: {
        id: string;
        title: string;
        difficulty: string;
        durationMinutes: number;
        startsAt: string;
        endsAt: string;
        state: string;
        companySlug: string | null;
        companyName: string | null;
      };
      questions: Array<{
        id: string;
        slug: string;
        title: string;
        topic: string;
        difficulty: string;
      }>;
      leaderboard: Array<{
        name: string;
        score: number;
        finishedAt: string | null;
      }>;
      myScore: number | null;
      joined?: boolean;
    }>(`/api/v1/me/contests/${encodeURIComponent(id)}`),
  createContest: (data: {
    title: string;
    companySlug?: string;
    difficulty: string;
    durationMinutes: number;
    questionCount: number;
    startsAt: string;
    endsAt: string;
  }) =>
    req<{ contest: { id: string; title: string; status: string }; picked: number }>(
      '/api/v1/admin/contests',
      { method: 'POST', body: JSON.stringify(data) },
    ),
  feedbackList: () => req<{ feedback: FeedbackItem[] }>('/api/v1/me/feedback'),
  myFeedback: () => req<{ feedback: FeedbackItem[] }>('/api/v1/me/feedback'),
  sendFeedback: (data: { category: string; message: string }) =>
    req<{ feedback: FeedbackItem }>('/api/v1/me/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submitFeedback: (data: { category: string; message: string }) =>
    req<{ feedback: FeedbackItem }>('/api/v1/me/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adminFeedback: (status?: string) =>
    req<{ feedback: FeedbackItem[] }>(
      `/api/v1/admin/feedback${status ? `?status=${encodeURIComponent(status)}` : ''}`,
    ),
  reviewFeedback: (
    feedbackId: string,
    data: {
      status?: 'open' | 'under_review' | 'resolved' | 'closed';
      adminResponse?: string | null;
    },
  ) =>
    req<{ feedback: FeedbackItem }>(`/api/v1/admin/feedback/${encodeURIComponent(feedbackId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
