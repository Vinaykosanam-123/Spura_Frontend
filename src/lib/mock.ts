// Dev-only mock data so the frontend is clickable while the backend is down.
// Enable with NEXT_PUBLIC_DEV_BYPASS=true in .env.local. Never used in prod.

/* eslint-disable @typescript-eslint/no-explicit-any */

const now = Date.now();
const iso = (ms: number) => new Date(now + ms).toISOString();
const H = 3600000;
const D = 24 * H;

const user = { id: 'u1', email: 'dev@example.com', fullName: 'Dev Student', roles: ['student', 'admin'] };

const courses = [
  { id: 'c1', slug: 'dsa', title: 'Data Structures & Algorithms', subtitle: 'From zero to interview-ready', description: 'Arrays, trees, graphs and DP, taught live.', level: 'beginner', estimatedDurationHours: 60, coverImageUrl: null, learningOutcomes: ['Solve 200+ problems', 'Crack coding rounds'], publishedAt: iso(-30 * D), openBatchCount: 1 },
  { id: 'c2', slug: 'fullstack', title: 'Full Stack Bootcamp', subtitle: 'Ship real apps', description: 'React, Node and Postgres, project-first.', level: 'intermediate', estimatedDurationHours: 90, coverImageUrl: null, learningOutcomes: ['Build and deploy a full app'], publishedAt: iso(-20 * D), openBatchCount: 1 },
];

const batch = { id: 'b1', code: 'DSA-2026-01', name: 'DSA January 2026', startAt: iso(-10 * D), endAt: iso(80 * D), capacity: 50, timezone: 'Asia/Kolkata', tuitionAmountMinor: 0, currency: 'INR', enrollmentOpensAt: null, enrollmentClosesAt: null, reservedSeats: 12, availableSeats: 38 };

const enrollment = { id: 'e1', state: 'active', activatedAt: iso(-9 * D), accessExpiresAt: iso(700 * D), batchId: 'b1', batchCode: batch.code, batchName: batch.name, batchStartAt: batch.startAt, batchEndAt: batch.endAt, courseId: 'c1', courseSlug: 'dsa', courseTitle: courses[0].title };

const lesson = (id: string, seq: number, title: string, locked: boolean, done: boolean) => ({
  id, sequence: seq, title, description: `${title} — core ideas and practice.`, type: 'video', durationSeconds: 900, watchedSeconds: done ? 900 : 0, completedAt: done ? iso(-5 * D) : null, locked,
});

const curriculum = [{
  enrollmentId: 'e1',
  course: { id: 'c1', slug: 'dsa', title: courses[0].title },
  modules: [
    { id: 'm1', sequence: 1, title: 'Arrays & Hashing', description: null, lessons: [lesson('l1', 1, 'Two Sum', false, true), lesson('l2', 2, 'Contains Duplicate', false, false), lesson('l3', 3, 'Valid Anagram', true, false)] },
    { id: 'm2', sequence: 2, title: 'Trees', description: null, lessons: [lesson('l4', 1, 'Invert Binary Tree', true, false)] },
  ],
}];

const live = [{ id: 'k1', title: 'Weekly DSA review', provider: 'zoho', meetingUrl: 'https://example.com/meet', scheduledAt: iso(2 * D), endsAt: iso(2 * D + H), status: 'scheduled', batchName: batch.name, courseTitle: courses[0].title }];

const recordings = [{ classId: 'k0', title: 'Intro to Big-O', recordingUrl: 'https://example.com/rec', scheduledAt: iso(-3 * D), batchName: batch.name, accessExpiresAt: iso(700 * D) }];

const announcements = [{ id: 'a1', title: 'Welcome aboard', body: 'Session 2 starts Monday.', publishedAt: iso(-1 * D) }];

const progress = [{ topic: 'Arrays', totalLessons: 6, completedLessons: 2, attendedLives: 1 }];

const submissions = [{ id: 's1', language: 'python', status: 'completed', verdict: 'accepted', createdAt: iso(-1 * D), questionTitle: 'Two Sum', questionSlug: 'two-sum' }];

const questions = [
  { id: 'q1', slug: 'two-sum', title: 'Two Sum', topic: 'arrays', difficulty: 'easy', solved: true, acceptance: 48, maxFrequency: 100, companies: [{ slug: 'tcs', name: 'TCS', frequency: 90 }] },
  { id: 'q2', slug: 'valid-anagram', title: 'Valid Anagram', topic: 'strings', difficulty: 'easy', solved: false, acceptance: 63, maxFrequency: 60, companies: [{ slug: 'infosys', name: 'Infosys', frequency: 55 }] },
];

const questionDetail = {
  question: { id: 'q1', title: 'Two Sum', difficulty: 'easy', topic: 'arrays', statement: 'Given an array and a target, return indices of the two numbers that add up to target.', version: { constraintsText: '2 <= n <= 10^4', timeLimitMs: 2000 } },
  samples: [{ id: 'sm1', stdin: '4\n2 7 11 15\n9', expected: '0 1' }],
};

const contest = { id: 'ct1', title: 'Weekly Sprint', difficulty: 'mixed', durationMinutes: 60, startsAt: iso(-1 * D), endsAt: iso(2 * D), state: 'live', total: 3, companySlug: null, companyName: null, myScore: null };
const mock = { id: 'mk1', difficulty: 'mixed', durationMinutes: 30, status: 'active', score: null, total: 3, startedAt: iso(-10 * 60000), endsAt: iso(20 * 60000), companySlug: null, companyName: null, questions: [{ id: 'q1', slug: 'two-sum', title: 'Two Sum', topic: 'arrays', difficulty: 'easy', solved: false }] };

export function mockResponse(path: string, method: string, body?: BodyInit | null): any {
  const m = method.toUpperCase();
  const p = path.split('?')[0];
  const q = path.includes('?') ? Object.fromEntries(new URLSearchParams(path.split('?')[1])) : {};
  const payload = typeof body === 'string' ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : {};

  if (m !== 'GET') {
    if (p.endsWith('/run')) return { results: [], allPassed: true };
    if (p.endsWith('/submit')) return { submission: { id: 's2', status: 'queued', createdAt: iso(0) } };
    if (p.endsWith('/analyze')) return { analysis: { timeComplexity: 'O(n)', spaceComplexity: 'O(1)', explanation: 'Mock analysis.', betterApproach: null } };
    if (p.endsWith('/attendance')) return { attended: true };
    if (p.endsWith('/complete')) return { progress: { lessonId: 'l1', watchedSeconds: 900, completedAt: iso(0), updatedAt: iso(0) } };
    if (p.match(/\/me\/lessons\/[^/]+\/progress$/) || p.endsWith('/me/progress') || p.endsWith('/my/progress')) {
      return { progress: { lessonId: 'l1', watchedSeconds: payload.watchedSeconds ?? 600, completedAt: null, updatedAt: iso(0) } };
    }
    if (p.endsWith('/logout')) return null;
    if (p.endsWith('/login') || p.endsWith('/register')) return { user };
    if (p.endsWith('/me/feedback') || p.endsWith('/my/feedback')) return { feedback: { id: 'f1', createdAt: iso(0) } };
    if (p.endsWith('/sandbox-complete')) return { outcome: { result: 'processed' } };
    if (p.endsWith('/join')) return { joined: true };
    if (p.endsWith('/mocks')) return { assessment: { ...mock, questions: mock.questions } };
    if (p.endsWith('/contests')) return { contest: { id: 'ct1', title: 'Weekly Sprint', status: 'scheduled' }, picked: 3 };
    return {};
  }

    if (p.endsWith('/auth/me') || p.endsWith('/me')) return { user };
  if (p.endsWith('/catalog/courses')) return { courses };
  if (p.includes('/catalog/courses/')) {
    const slug = p.split('/catalog/courses/')[1];
    const course = courses.find((c) => c.slug === slug);
    if (!course) return {};
    return { course, batches: [batch], pricingPlans: [{ id: 'pp1', courseId: course.id, name: 'Standard Plan', code: 'STD', amountMinor: 499900, currency: 'INR', billingInterval: 'one_time', accessDurationDays: 365, isActive: true }] };
  }
  if (p.endsWith('/courses/courses')) return { courses };
  if (p.includes('/courses/courses/')) return { course: courses[0], batches: [batch] };
  if (p.endsWith('/me/enrollments')) return { enrollments: [enrollment] };
  if (p.endsWith('/me/orders')) return { orders: [] };
  if (p.endsWith('/me/invoices')) return { invoices: [] };
  if (p.endsWith('/me/refunds')) return { refunds: [] };
  if (p.endsWith('/me/notifications')) return { notifications: [], unreadCount: 0 };
  if (p.endsWith('/me/curriculum')) return { curriculum };
  if (p.match(/\/me\/lessons\/[^/]+$/)) return { lesson: { enrollmentId: 'e1', id: 'l1', title: 'Two Sum', description: 'Learn two pointers.', type: 'video', videoProviderId: null, durationSeconds: 900, watchedSeconds: 120, completedAt: null, locked: false, resources: [{ id: 'r1', sequence: 1, title: 'Slides', resourceUrl: 'https://example.com/slides', contentType: 'link' }] } };
  if (p.match(/\/me\/lessons\/[^/]+\/questions$/)) return { questions: [{ id: 'q1', slug: 'two-sum', title: 'Two Sum', topic: 'arrays', difficulty: 'easy', externalUrl: null, sequence: 1 }] };
  if (p.endsWith('/me/live/upcoming')) return { live };
  if (p.endsWith('/me/recordings')) return { recordings };
  if (p.endsWith('/me/announcements')) return { announcements };
  if (p.endsWith('/me/progress')) return { progress };
  if (p.endsWith('/me/submissions') && !p.includes('/s1')) return { submissions, nextCursor: null };
  if (p.includes('/me/submissions/')) return { submission: { ...submissions[0], score: 100, runtimeMs: 42, testsPassed: 5, testsTotal: 5 } };
  if (p.match(/\/me\/questions\/[^/]+$/)) return questionDetail;
  if (p.endsWith('/me/bank/companies')) return { companies: [{ id: 'co1', slug: 'tcs', name: 'TCS', oaCount: 3, practiceCount: 42 }] };
  if (p.match(/\/me\/bank\/companies\/[^/]+\/practice$/)) return { questions: questions.map((x) => ({ ...x, frequency: x.maxFrequency, recency: 'thirty-days', revisionPriority: null, notes: null })) };
  if (p.match(/\/me\/bank\/companies\/[^/]+\/oa$/)) return { questions: [] };
  if (p.endsWith('/me/bank/questions')) {
    let list = questions;
    if (q.q) {
      const needle = q.q.toLowerCase();
      list = list.filter((x) => x.title.toLowerCase().includes(needle) || x.topic.toLowerCase().includes(needle));
    }
    if (q.difficulty) list = list.filter((x) => x.difficulty === q.difficulty);
    if (q.topic) list = list.filter((x) => x.topic === q.topic);
    if (q.solved === 'true') list = list.filter((x) => x.solved);
    if (q.solved === 'false') list = list.filter((x) => !x.solved);
    return { questions: list };
  }
  if (p.match(/\/me\/bank\/questions\/[^/]+$/)) return { question: questionDetail.question, samples: questionDetail.samples, hints: [{ sequence: 1, hint: 'Use a hash map.' }], companies: [] };
  if (p.endsWith('/me/mocks')) return { mocks: [mock] };
  if (p.match(/\/me\/mocks\/[^/]+$/)) return { assessment: mock };
  if (p.endsWith('/me/contests')) return { contests: [contest] };
  if (p.match(/\/me\/contests\/[^/]+$/)) return { contest: { ...contest, state: 'live' }, questions: [{ id: 'q1', slug: 'two-sum', title: 'Two Sum', topic: 'arrays', difficulty: 'easy' }], leaderboard: [{ name: 'Dev Student', score: 0, finishedAt: null }], myScore: null };
  if (p.endsWith('/me/feedback')) return { feedback: [{ id: 'f1', category: 'suggestion', message: 'Great platform', createdAt: iso(-2 * D) }] };
  if (p.endsWith('/admin/courses')) return { courses };
  if (p.endsWith('/admin/users')) return { users: [user] };
  if (p.endsWith('/admin/batches')) return { batches: [batch] };
  if (p.endsWith('/admin/orders')) return { orders: [] };
  if (p.endsWith('/admin/contests')) return { contests: [contest] };
  if (p.endsWith('/admin/invoices')) return { invoices: [] };
  if (p.endsWith('/admin/refunds')) return { refunds: [] };
  if (p.endsWith('/admin/notifications')) return { notifications: [] };
  if (p.endsWith('/admin/feedback')) return { feedback: [{ id: 'f1', category: 'bug', status: 'open', message: 'Editor lags on mobile', createdAt: iso(-1 * D), email: 'a@b.com', fullName: 'A B' }] };
  if (p.match(/\/admin\/courses\/[^/]+\/curriculum$/)) return { course: { id: 'c1', slug: 'dsa', title: courses[0].title }, modules: curriculum[0].modules };
  return {};
}

export const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
