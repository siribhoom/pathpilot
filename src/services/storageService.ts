/**
 * ============================================================================
 * FILE: src/services/storageService.ts
 * PURPOSE: Provides a clean, unified data persistence layer for Student Profiles
 *          and Semester-Wise Roadmaps.
 *
 * HOW STORAGE & SECURITY WORK IN PATHPILOT (Beginner Explanation):
 * 1. Cloud Firestore Mode (When Signed In with Google via Firebase Auth):
 *    - Each user has a unique, cryptographically verified `uid` from Firebase Auth.
 *    - Profile data is stored at `/users/{uid}`.
 *    - Each semester's roadmap, tasks, skills, projects, and progress is stored
 *      at `/users/{uid}/semesters/{semesterId}` (e.g. `sem_1` to `sem_8`).
 *    - Firestore Security Rules (`firestore.rules`) strictly verify on Google's
 *      servers that `request.auth.uid == userId`, protecting every student's records.
 *
 * 2. Local Browser Storage Mode (When Not Signed In to Google Cloud):
 *    - If a student uses PathPilot without signing in to Google (or if popups are
 *      blocked in an embedded preview), data is saved in the browser's `localStorage`
 *      partitioned by unique local account IDs (`local_user_1`, `local_user_2`, etc.).
 *    - IMPORTANT LIMITATION: Browser `localStorage` is NOT cloud storage. It lives
 *      only inside this browser on this device. Clearing browser data will erase it,
 *      and it will not sync across devices unless you sign in with Google.
 *
 * 3. Never Overwriting Saved Roadmaps Automatically:
 *    - `ensureSemesterRecordExists` checks if a semester document (`sem_X`) already
 *      exists before creating one. If it exists (e.g., on page refresh), it loads
 *      the existing saved roadmap and progress without regenerating or overwriting!
 * ============================================================================
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AcademicSemester, SemesterRecord, StudentProfile } from '../types/student';
import {
  generatePersonalizedSemesterRecord,
  semesterNameToId,
} from '../utils/roadmapGenerator';

// Keys used strictly for Local Browser Mode (partitioned by account ID)
const LOCAL_ACTIVE_USER_ID_KEY = 'pathpilot_v2_active_local_uid';
const LOCAL_ACCOUNTS_INDEX_KEY = 'pathpilot_v2_local_accounts_index';
const LEGACY_V1_PROFILE_KEY = 'pathpilot_v1_student_profile';

export interface LocalAccountSummary {
  userId: string;
  fullName: string;
  branch: string;
  currentSemester: string;
}

function getLocalProfileKey(userId: string): string {
  return `pathpilot_v2_profile_${userId}`;
}

function getLocalSemestersKey(userId: string): string {
  return `pathpilot_v2_semesters_${userId}`;
}

/**
 * Converts Firestore Timestamp fields (`createdAt`, `updatedAt`) into ISO strings
 * for our React state.
 */
function timestampToIso(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string' && val.length > 0) {
    return val;
  }
  return new Date().toISOString();
}

/**
 * Lists all local browser accounts created on this device so the user can test
 * account separation even in Local Browser Mode.
 */
export function listLocalAccounts(): LocalAccountSummary[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_ACCOUNTS_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalAccountToIndex(profile: StudentProfile): void {
  try {
    const existing = listLocalAccounts();
    const summary: LocalAccountSummary = {
      userId: profile.userId,
      fullName: profile.fullName,
      branch: profile.branch,
      currentSemester: profile.currentSemester,
    };
    const updated = [
      summary,
      ...existing.filter((item) => item.userId !== profile.userId),
    ];
    window.localStorage.setItem(LOCAL_ACCOUNTS_INDEX_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to update local accounts index:', err);
  }
}

/**
 * Gets or initializes the active local browser account ID, and migrates any
 * legacy Version 1 profile automatically so existing users don't lose data.
 */
export function getOrInitActiveLocalUserId(): string {
  try {
    let activeId = window.localStorage.getItem(LOCAL_ACTIVE_USER_ID_KEY);
    if (activeId) {
      return activeId;
    }

    // Check if there is a legacy Version 1 profile to migrate cleanly
    const legacyRaw = window.localStorage.getItem(LEGACY_V1_PROFILE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (legacyParsed && typeof legacyParsed.fullName === 'string') {
        const migratedId = 'local_student_1';
        const nowIso = new Date().toISOString();
        const migratedProfile: StudentProfile = {
          userId: migratedId,
          fullName: legacyParsed.fullName,
          branch: legacyParsed.branch || 'CSE',
          customBranchName: legacyParsed.customBranchName || '',
          currentYear: legacyParsed.currentYear || '1st Year',
          currentSemester: legacyParsed.currentSemester || 'Semester 1',
          currentSubjects: Array.isArray(legacyParsed.currentSubjects)
            ? legacyParsed.currentSubjects
            : ['Engineering Mathematics'],
          careerGoal: legacyParsed.careerGoal || 'Software Engineer',
          knownSkills: Array.isArray(legacyParsed.knownSkills)
            ? legacyParsed.knownSkills
            : [],
          weeklyStudyHours: Number(legacyParsed.weeklyStudyHours) || 10,
          preferredLearningMethod:
            legacyParsed.preferredLearningMethod || 'Hands-on Project Building',
          createdAt: legacyParsed.updatedAt || nowIso,
          updatedAt: legacyParsed.updatedAt || nowIso,
        };

        window.localStorage.setItem(
          getLocalProfileKey(migratedId),
          JSON.stringify(migratedProfile)
        );
        saveLocalAccountToIndex(migratedProfile);
        window.localStorage.setItem(LOCAL_ACTIVE_USER_ID_KEY, migratedId);
        return migratedId;
      }
    }

    activeId = `local_student_${Date.now()}`;
    window.localStorage.setItem(LOCAL_ACTIVE_USER_ID_KEY, activeId);
    return activeId;
  } catch {
    return 'local_student_default';
  }
}

export function setActiveLocalUserId(userId: string): void {
  try {
    window.localStorage.setItem(LOCAL_ACTIVE_USER_ID_KEY, userId);
  } catch (err) {
    console.warn('Could not set active local user ID:', err);
  }
}

export function createNewLocalAccountId(): string {
  const newId = `local_student_${Date.now()}`;
  setActiveLocalUserId(newId);
  return newId;
}

/**
 * ============================================================================
 * PROFILE OPERATIONS (Load & Save)
 * ============================================================================
 */

export async function loadStudentProfile(
  userId: string,
  isCloudAuthenticated: boolean
): Promise<StudentProfile | null> {
  if (isCloudAuthenticated) {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) {
        return null;
      }
      const data = snap.data();
      return {
        userId: data.userId,
        fullName: data.fullName,
        branch: data.branch,
        customBranchName: data.customBranchName || '',
        currentYear: data.currentYear,
        currentSemester: data.currentSemester,
        currentSubjects: Array.isArray(data.currentSubjects) ? data.currentSubjects : [],
        careerGoal: data.careerGoal,
        knownSkills: Array.isArray(data.knownSkills) ? data.knownSkills : [],
        weeklyStudyHours: Number(data.weeklyStudyHours) || 10,
        preferredLearningMethod: data.preferredLearningMethod,
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  // Local Browser Mode fallback
  try {
    const raw = window.localStorage.getItem(getLocalProfileKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as StudentProfile;
  } catch (err) {
    console.warn('Failed to read local profile:', err);
    return null;
  }
}

export async function saveStudentProfile(
  profile: StudentProfile,
  isCloudAuthenticated: boolean
): Promise<StudentProfile> {
  const sanitizedProfile: StudentProfile = {
    ...profile,
    fullName: profile.fullName.trim().slice(0, 80),
    customBranchName: (profile.customBranchName || '').trim().slice(0, 80),
    currentSubjects: profile.currentSubjects.slice(0, 15).map((s) => s.trim().slice(0, 100)),
    careerGoal: profile.careerGoal.trim().slice(0, 120),
    knownSkills: profile.knownSkills.slice(0, 30).map((s) => s.trim().slice(0, 80)),
    weeklyStudyHours: Math.min(60, Math.max(1, Math.round(Number(profile.weeklyStudyHours) || 10))),
    updatedAt: new Date().toISOString(),
  };

  if (isCloudAuthenticated) {
    const path = `users/${sanitizedProfile.userId}`;
    const userRef = doc(db, 'users', sanitizedProfile.userId);
    try {
      const existingSnap = await getDoc(userRef);
      if (!existingSnap.exists()) {
        await setDoc(userRef, {
          userId: sanitizedProfile.userId,
          fullName: sanitizedProfile.fullName,
          branch: sanitizedProfile.branch,
          customBranchName: sanitizedProfile.customBranchName,
          currentYear: sanitizedProfile.currentYear,
          currentSemester: sanitizedProfile.currentSemester,
          currentSubjects: sanitizedProfile.currentSubjects,
          careerGoal: sanitizedProfile.careerGoal,
          knownSkills: sanitizedProfile.knownSkills,
          weeklyStudyHours: sanitizedProfile.weeklyStudyHours,
          preferredLearningMethod: sanitizedProfile.preferredLearningMethod,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          fullName: sanitizedProfile.fullName,
          branch: sanitizedProfile.branch,
          customBranchName: sanitizedProfile.customBranchName,
          currentYear: sanitizedProfile.currentYear,
          currentSemester: sanitizedProfile.currentSemester,
          currentSubjects: sanitizedProfile.currentSubjects,
          careerGoal: sanitizedProfile.careerGoal,
          knownSkills: sanitizedProfile.knownSkills,
          weeklyStudyHours: sanitizedProfile.weeklyStudyHours,
          preferredLearningMethod: sanitizedProfile.preferredLearningMethod,
          updatedAt: serverTimestamp(),
        });
      }
      return sanitizedProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Local Browser Mode
  try {
    window.localStorage.setItem(
      getLocalProfileKey(sanitizedProfile.userId),
      JSON.stringify(sanitizedProfile)
    );
    saveLocalAccountToIndex(sanitizedProfile);
  } catch (err) {
    console.warn('Failed to save profile to localStorage:', err);
  }

  return sanitizedProfile;
}

/**
 * ============================================================================
 * SEMESTER RECORD OPERATIONS (Load All, Ensure Exists, Save / Update)
 * ============================================================================
 */

export async function loadAllSemesterRecords(
  userId: string,
  isCloudAuthenticated: boolean
): Promise<Record<string, SemesterRecord>> {
  if (isCloudAuthenticated) {
    const path = `users/${userId}/semesters`;
    try {
      const colRef = collection(db, 'users', userId, 'semesters');
      const snap = await getDocs(colRef);
      const records: Record<string, SemesterRecord> = {};
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        records[d.semesterId] = {
          semesterId: d.semesterId,
          userId: d.userId,
          semesterName: d.semesterName,
          academicYear: d.academicYear,
          branch: d.branch,
          careerGoal: d.careerGoal,
          weeklyStudyHours: Number(d.weeklyStudyHours) || 10,
          preferredLearningMethod: d.preferredLearningMethod,
          subjects: Array.isArray(d.subjects) ? d.subjects : [],
          status: d.status === 'completed' ? 'completed' : 'active',
          progressPercent: Number(d.progressPercent) || 0,
          subjectBridges: Array.isArray(d.subjectBridges) ? d.subjectBridges : [],
          monthlyPlans: Array.isArray(d.monthlyPlans) ? d.monthlyPlans : [],
          weeklyPlans: Array.isArray(d.weeklyPlans) ? d.weeklyPlans : [],
          skills: Array.isArray(d.skills) ? d.skills : [],
          projects: Array.isArray(d.projects) ? d.projects : [],
          opportunities: Array.isArray(d.opportunities) ? d.opportunities : [],
          placementTasks: Array.isArray(d.placementTasks) ? d.placementTasks : [],
          createdAt: timestampToIso(d.createdAt),
          updatedAt: timestampToIso(d.updatedAt),
        };
      });
      return records;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  // Local Browser Mode
  try {
    const raw = window.localStorage.getItem(getLocalSemestersKey(userId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SemesterRecord>;
  } catch (err) {
    console.warn('Failed to load local semester records:', err);
    return {};
  }
}

export async function saveSemesterRecord(
  record: SemesterRecord,
  isCloudAuthenticated: boolean
): Promise<SemesterRecord> {
  const updatedRecord: SemesterRecord = {
    ...record,
    subjects: record.subjects.slice(0, 15),
    subjectBridges: record.subjectBridges.slice(0, 15),
    monthlyPlans: record.monthlyPlans.slice(0, 6),
    weeklyPlans: record.weeklyPlans.slice(0, 20),
    skills: record.skills.slice(0, 30),
    projects: record.projects.slice(0, 10),
    opportunities: record.opportunities.slice(0, 15),
    placementTasks: record.placementTasks.slice(0, 20),
    updatedAt: new Date().toISOString(),
  };

  if (isCloudAuthenticated) {
    const path = `users/${updatedRecord.userId}/semesters/${updatedRecord.semesterId}`;
    const semRef = doc(db, 'users', updatedRecord.userId, 'semesters', updatedRecord.semesterId);
    try {
      const existingSnap = await getDoc(semRef);
      if (!existingSnap.exists()) {
        await setDoc(semRef, {
          semesterId: updatedRecord.semesterId,
          userId: updatedRecord.userId,
          semesterName: updatedRecord.semesterName,
          academicYear: updatedRecord.academicYear,
          branch: updatedRecord.branch,
          careerGoal: updatedRecord.careerGoal,
          weeklyStudyHours: updatedRecord.weeklyStudyHours,
          preferredLearningMethod: updatedRecord.preferredLearningMethod,
          subjects: updatedRecord.subjects,
          status: updatedRecord.status,
          progressPercent: updatedRecord.progressPercent,
          subjectBridges: updatedRecord.subjectBridges,
          monthlyPlans: updatedRecord.monthlyPlans,
          weeklyPlans: updatedRecord.weeklyPlans,
          skills: updatedRecord.skills,
          projects: updatedRecord.projects,
          opportunities: updatedRecord.opportunities,
          placementTasks: updatedRecord.placementTasks,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(semRef, {
          semesterName: updatedRecord.semesterName,
          academicYear: updatedRecord.academicYear,
          branch: updatedRecord.branch,
          careerGoal: updatedRecord.careerGoal,
          weeklyStudyHours: updatedRecord.weeklyStudyHours,
          preferredLearningMethod: updatedRecord.preferredLearningMethod,
          subjects: updatedRecord.subjects,
          status: updatedRecord.status,
          progressPercent: updatedRecord.progressPercent,
          subjectBridges: updatedRecord.subjectBridges,
          monthlyPlans: updatedRecord.monthlyPlans,
          weeklyPlans: updatedRecord.weeklyPlans,
          skills: updatedRecord.skills,
          projects: updatedRecord.projects,
          opportunities: updatedRecord.opportunities,
          placementTasks: updatedRecord.placementTasks,
          updatedAt: serverTimestamp(),
        });
      }
      return updatedRecord;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Local Browser Mode
  try {
    const all = await loadAllSemesterRecords(updatedRecord.userId, false);
    all[updatedRecord.semesterId] = updatedRecord;
    window.localStorage.setItem(
      getLocalSemestersKey(updatedRecord.userId),
      JSON.stringify(all)
    );
  } catch (err) {
    console.warn('Failed to save semester record locally:', err);
  }

  return updatedRecord;
}

/**
 * Ensures that a semester record exists for the student's current semester.
 * CRITICAL RULE: If the semester record ALREADY exists in storage, it returns
 * the existing record untouched so page refreshes NEVER overwrite saved roadmaps
 * or create duplicate roadmaps!
 */
export async function ensureSemesterRecordExists(
  profile: StudentProfile,
  existingRecords: Record<string, SemesterRecord>,
  isCloudAuthenticated: boolean,
  targetSemester?: AcademicSemester
): Promise<{
  records: Record<string, SemesterRecord>;
  activeRecord: SemesterRecord;
}> {
  const semName = targetSemester || profile.currentSemester;
  const semId = semesterNameToId(semName);

  // If already saved, return it immediately without regenerating!
  if (existingRecords[semId]) {
    return {
      records: existingRecords,
      activeRecord: existingRecords[semId],
    };
  }

  // Otherwise, generate initial semester roadmap and persist it once
  const generated = generatePersonalizedSemesterRecord(profile, semName);
  const saved = await saveSemesterRecord(generated, isCloudAuthenticated);
  const updatedMap = {
    ...existingRecords,
    [semId]: saved,
  };

  return {
    records: updatedMap,
    activeRecord: saved,
  };
}
