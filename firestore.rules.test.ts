/**
 * ============================================================================
 * FILE: firestore.rules.test.ts
 * PURPOSE: Phase 0 Security Test Specification verifying that all "Dirty Dozen"
 *          adversarial payloads defined in security_spec.md are rejected with
 *          PERMISSION_DENIED by our Firestore Security Rules.
 * ============================================================================
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Write to /users/user_1',
    operation: 'create',
    path: '/users/user_1',
    auth: null,
    payload: { userId: 'user_1', fullName: 'Aarav Sharma' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoof on /users/user_1',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: false },
    payload: { userId: 'user_1', fullName: 'Aarav Sharma' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User Profile Hijack (user_2 reading /users/user_1)',
    operation: 'get',
    path: '/users/user_1',
    auth: { uid: 'user_2', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection (isAdmin: true) on Profile Create',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      userId: 'user_1',
      fullName: 'Aarav Sharma',
      isAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Oversized String Denial-of-Wallet (5000-char fullName)',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      userId: 'user_1',
      fullName: 'A'.repeat(5000),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Out-of-Bounds Weekly Study Hours (500 hours/week)',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      userId: 'user_1',
      weeklyStudyHours: 500,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Unbounded Subject Array Poisoning (> 15 subjects)',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      userId: 'user_1',
      currentSubjects: new Array(25).fill('Subject'),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immutable Field Mutation (changing createdAt or userId on update)',
    operation: 'update',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      userId: 'user_2',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Client Timestamp Forgery (updatedAt != request.time)',
    operation: 'update',
    path: '/users/user_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      updatedAt: '1999-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Orphaned Semester Subcollection Write without parent /users/user_1',
    operation: 'create',
    path: '/users/user_1/semesters/sem_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      semesterId: 'sem_1',
      userId: 'user_1',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal State Bypass on Completed Semester Record',
    operation: 'update',
    path: '/users/user_1/semesters/sem_1',
    auth: { uid: 'user_1', email_verified: true },
    payload: {
      status: 'completed',
      progressPercent: 50,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthorized List Scraping (/users/user_1/semesters by user_2)',
    operation: 'list',
    path: '/users/user_1/semesters',
    auth: { uid: 'user_2', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
