# PathPilot Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants & Master Source of Truth

1. **Master Source of Truth**: `/users/{userId}` is the root identity document for each student. Every student's `userId` document ID and internal `userId` field must strictly equal `request.auth.uid` with `request.auth.token.email_verified == true`.
2. **Relational Sync (Master Gate)**: A semester record at `/users/{userId}/semesters/{semesterId}` cannot exist or be accessed unless the parent `/users/{userId}` document exists and belongs to `request.auth.uid`.
3. **Strict Schema & Volumetric Bounds**: Every string, number, and list is strictly bounded by length/range, and only explicitly declared keys are permitted (`hasAll` + `hasOnly` on create, `affectedKeys().hasOnly(...)` on update).
4. **Immutability & Temporal Integrity**: `userId`, `semesterId`, and `createdAt` are immutable after creation. `createdAt` (on create) and `updatedAt` (on create/update) must equal `request.time`.
5. **Terminal State Locking**: Once a `SemesterRecord` reaches `status == 'completed'`, subsequent updates to that completed record are blocked unless explicitly reopened via a dedicated status transition or new semester creation.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Unauthenticated Write**: `request.auth == null` attempting to create `/users/user_1`.
2. **Unverified Email Spoof**: `request.auth.uid == 'user_1'` with `email_verified: false` attempting to create `/users/user_1`.
3. **Cross-User Profile Hijack (Identity Spoofing)**: `user_2` attempting to read or write `/users/user_1`.
4. **Shadow Field Injection on Profile Create**: Adding `"isAdmin": true` to `/users/user_1`.
5. **Oversized String Denial-of-Wallet**: Sending a 5,000-character `fullName` to `/users/user_1`.
6. **Out-of-Bounds Study Hours**: Setting `weeklyStudyHours: 500` or `-10` on `/users/user_1`.
7. **Unbounded Subject Array Poisoning**: Sending 50 subjects (`currentSubjects.size() > 15`) or non-string array element `currentSubjects: [123]`.
8. **Immutable Field Mutation**: Attempting to mutate `createdAt` or `userId` during an update to `/users/user_1`.
9. **Client Timestamp Forgery**: Sending a past or future timestamp instead of `request.time` for `updatedAt`.
10. **Orphaned Semester Subcollection Write**: Attempting to create `/users/user_1/semesters/sem_1` when `/users/user_1` does not exist.
11. **Terminal State Bypass on Completed Semester**: Attempting to modify `progressPercent` on `/users/user_1/semesters/sem_1` after `status` is already `'completed'`.
12. **Unauthorized List Scraping**: Attempting to list `/users/user_1/semesters` as `user_2`.
