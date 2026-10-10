/**
 * ============================================================================
 * FILE: src/App.tsx
 * PURPOSE: Root application component that coordinates authentication,
 *          persistent storage (Cloud Firestore + Local Browser Account fallback),
 *          onboarding form reset, profile editing, and semester management.
 *
 * BEGINNER CONCEPTS EXPLAINED IN THIS FILE:
 * 1. Why the Onboarding Form Previously Retained Values (And How We Fixed It):
 *    Previously, clicking "Build My Roadmap" and "Edit Profile" both rendered
 *    `<OnboardingForm initialProfile={studentProfile} />`. Whenever `studentProfile`
 *    existed, the form initialized with the saved values instead of empty fields.
 *    NOW:
 *    - Clicking "Build My Roadmap" calls `handleStartFreshOnboarding()`, which
 *      increments `onboardingResetKey` and opens `<OnboardingForm mode="onboarding" />`
 *      where all fields, dropdowns, and validation messages start 100% empty.
 *    - Clicking "Edit Profile" opens the `My Profile` section inside `<Dashboard />`
 *      with `isEditingProfile = true`, which loads the saved profile into the
 *      separate edit form and only updates storage when "Save Changes" is clicked.
 *
 * 2. Never Overwriting Saved Roadmaps on Page Refresh:
 *    Inside `useEffect`, when the page loads or refreshes, we call
 *    `loadStudentProfile()` and `loadAllSemesterRecords()`. If a saved profile
 *    and semester roadmap already exist in Firestore (or local storage), we load
 *    them directly into state without calling the roadmap generator!
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from './firebase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { OnboardingForm } from './components/OnboardingForm';
import { Dashboard } from './components/Dashboard';
import {
  AcademicSemester,
  DashboardSectionId,
  SemesterRecord,
  StudentProfile,
} from './types/student';
import {
  generatePersonalizedSemesterRecord,
  getAcademicYearForSemester,
  semesterNameToId,
} from './utils/roadmapGenerator';
import {
  createNewLocalAccountId,
  ensureSemesterRecordExists,
  getOrInitActiveLocalUserId,
  listLocalAccounts,
  loadAllSemesterRecords,
  loadStudentProfile,
  LocalAccountSummary,
  saveSemesterRecord,
  saveStudentProfile,
  setActiveLocalUserId,
} from './services/storageService';

type AppView = 'landing' | 'onboarding' | 'dashboard';

export default function App() {
  // 1. Authentication & Active Account Identity State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [localUserId, setLocalUserId] = useState<string>(() =>
    getOrInitActiveLocalUserId()
  );
  const [localAccounts, setLocalAccounts] = useState<LocalAccountSummary[]>(() =>
    listLocalAccounts()
  );

  // Determine whether we are currently using authenticated Cloud Firestore or Local Browser Mode
  const isCloudAuthenticated = Boolean(firebaseUser && firebaseUser.emailVerified);
  const effectiveUserId = isCloudAuthenticated && firebaseUser ? firebaseUser.uid : localUserId;

  // 2. Persistent Student Profile & Semester Records State
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [semesterRecords, setSemesterRecords] = useState<Record<string, SemesterRecord>>({});
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  // 3. Navigation & Form Reset State
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeDashboardSection, setActiveDashboardSection] =
    useState<DashboardSectionId | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  /**
   * `onboardingResetKey` is incremented every time the user clicks "Build My Roadmap".
   * Passing `key={onboardingResetKey}` to `<OnboardingForm mode="onboarding" />`
   * forces React to mount a brand-new, completely blank form instance without
   * touching `studentProfile` in state or storage.
   */
  const [onboardingResetKey, setOnboardingResetKey] = useState<number>(1);

  // Listen for Firebase Authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Load the active student's profile and saved semester roadmaps whenever
   * `effectiveUserId` or `isCloudAuthenticated` changes (or on initial page refresh).
   */
  const hydrateUserWorkspace = useCallback(async () => {
    if (!isAuthReady) return;
    setIsLoadingData(true);
    setStorageError(null);

    try {
      const loadedProfile = await loadStudentProfile(effectiveUserId, isCloudAuthenticated);
      if (!loadedProfile) {
        setStudentProfile(null);
        setSemesterRecords({});
        setIsLoadingData(false);
        return;
      }

      const loadedSemesters = await loadAllSemesterRecords(
        effectiveUserId,
        isCloudAuthenticated
      );

      // Ensure the current semester has a saved roadmap (loads existing without overwriting!)
      const { records } = await ensureSemesterRecordExists(
        loadedProfile,
        loadedSemesters,
        isCloudAuthenticated
      );

      setStudentProfile(loadedProfile);
      setSemesterRecords(records);
      setLocalAccounts(listLocalAccounts());

      // If the user refreshes the page and already has a saved profile, open their Dashboard
      setCurrentView((prevView) => (prevView === 'landing' ? 'dashboard' : prevView));
    } catch (err) {
      console.error('Error loading workspace data:', err);
      setStorageError(
        'Could not load your saved records. Please check your connection or try again.'
      );
    } finally {
      setIsLoadingData(false);
    }
  }, [effectiveUserId, isCloudAuthenticated, isAuthReady]);

  useEffect(() => {
    hydrateUserWorkspace();
  }, [hydrateUserWorkspace]);

  // Smooth scroll to top when changing top-level views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, activeDashboardSection]);

  /**
   * ==========================================================================
   * HANDLER 1: Start Fresh Onboarding ("Build My Roadmap")
   * Resets only the onboarding form inputs by incrementing `onboardingResetKey`
   * and switching to `'onboarding'`. Does NOT delete `studentProfile`!
   * ==========================================================================
   */
  const handleStartFreshOnboarding = () => {
    setOnboardingResetKey((prev) => prev + 1);
    setIsEditingProfile(false);
    setCurrentView('onboarding');
  };

  /**
   * ==========================================================================
   * HANDLER 2: Open Profile Editing ("Edit Profile")
   * Opens the Dashboard's "My Profile" section with `isEditingProfile = true`,
   * loading the student's saved details into the edit form.
   * ==========================================================================
   */
  const handleOpenEditProfile = () => {
    if (!studentProfile) {
      handleStartFreshOnboarding();
      return;
    }
    setActiveDashboardSection('my-profile');
    setIsEditingProfile(true);
    setCurrentView('dashboard');
  };

  /**
   * ==========================================================================
   * HANDLER 3: Complete Fresh Onboarding Submission
   * Saves the student profile and generates/loads their initial semester roadmap.
   * ==========================================================================
   */
  const handleCompleteOnboarding = async (
    newProfile: StudentProfile,
    replaceRoadmapConfirmed: boolean
  ) => {
    setIsSaving(true);
    setStorageError(null);

    try {
      const profileWithUser: StudentProfile = {
        ...newProfile,
        userId: effectiveUserId,
      };

      const savedProfile = await saveStudentProfile(
        profileWithUser,
        isCloudAuthenticated
      );

      const targetSemId = semesterNameToId(savedProfile.currentSemester);
      let nextRecords = { ...semesterRecords };

      // Generate a new roadmap only if one doesn't exist for this semester OR user confirmed replacement
      if (!nextRecords[targetSemId] || replaceRoadmapConfirmed) {
        const generatedRecord = generatePersonalizedSemesterRecord(savedProfile);
        const savedRecord = await saveSemesterRecord(
          generatedRecord,
          isCloudAuthenticated
        );
        nextRecords = {
          ...nextRecords,
          [targetSemId]: savedRecord,
        };
      }

      setStudentProfile(savedProfile);
      setSemesterRecords(nextRecords);
      setLocalAccounts(listLocalAccounts());
      setActiveDashboardSection(null);
      setIsEditingProfile(false);
      setCurrentView('dashboard');
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
      setStorageError('Failed to save your onboarding profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * ==========================================================================
   * HANDLER 4: Save Profile Edits from "My Profile"
   * Updates the saved student profile WITHOUT overwriting existing semester
   * roadmaps or progress! If the user switched to a semester that doesn't have
   * a roadmap yet, initializes that semester's record while keeping past ones.
   * ==========================================================================
   */
  const handleSaveProfileEdits = async (updatedProfile: StudentProfile) => {
    setIsSaving(true);
    setStorageError(null);

    try {
      const savedProfile = await saveStudentProfile(
        updatedProfile,
        isCloudAuthenticated
      );

      const { records } = await ensureSemesterRecordExists(
        savedProfile,
        semesterRecords,
        isCloudAuthenticated
      );

      setStudentProfile(savedProfile);
      setSemesterRecords(records);
      setLocalAccounts(listLocalAccounts());
    } catch (err) {
      console.error('Failed to update profile:', err);
      setStorageError('Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * ==========================================================================
   * HANDLER 5: Update a Semester Record (Tasks, Skills, Projects, Opportunities)
   * ==========================================================================
   */
  const handleUpdateSemesterRecord = async (updatedRecord: SemesterRecord) => {
    setIsSaving(true);
    setStorageError(null);
    try {
      const saved = await saveSemesterRecord(updatedRecord, isCloudAuthenticated);
      setSemesterRecords((prev) => ({
        ...prev,
        [saved.semesterId]: saved,
      }));
    } catch (err) {
      console.error('Failed to save semester progress:', err);
      setStorageError('Could not save your latest progress update.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * ==========================================================================
   * HANDLER 6: Explicitly Regenerate a Semester Roadmap (After User Confirmation)
   * ==========================================================================
   */
  const handleRegenerateSemesterRoadmap = async (
    semesterName: AcademicSemester,
    subjects: string[]
  ) => {
    if (!studentProfile) return;
    setIsSaving(true);
    setStorageError(null);
    try {
      const regenerated = generatePersonalizedSemesterRecord(
        studentProfile,
        semesterName,
        subjects
      );
      const saved = await saveSemesterRecord(regenerated, isCloudAuthenticated);
      setSemesterRecords((prev) => ({
        ...prev,
        [saved.semesterId]: saved,
      }));
    } catch (err) {
      console.error('Failed to regenerate roadmap:', err);
      setStorageError('Could not regenerate the semester roadmap.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * ==========================================================================
   * HANDLER 7: Start a New Semester (Without Deleting Previous Semesters)
   * ==========================================================================
   */
  const handleStartNewSemester = async (
    newSemesterName: AcademicSemester,
    newSubjects: string[]
  ) => {
    if (!studentProfile) return;
    setIsSaving(true);
    setStorageError(null);

    try {
      const newYear = getAcademicYearForSemester(newSemesterName);
      const updatedProfile: StudentProfile = {
        ...studentProfile,
        currentYear: newYear,
        currentSemester: newSemesterName,
        currentSubjects: newSubjects,
        updatedAt: new Date().toISOString(),
      };

      const savedProfile = await saveStudentProfile(
        updatedProfile,
        isCloudAuthenticated
      );

      const semId = semesterNameToId(newSemesterName);
      let nextRecords = { ...semesterRecords };

      // Only generate if this new semester doesn't already have a saved record
      if (!nextRecords[semId]) {
        const generated = generatePersonalizedSemesterRecord(
          savedProfile,
          newSemesterName,
          newSubjects
        );
        const savedSem = await saveSemesterRecord(generated, isCloudAuthenticated);
        nextRecords = {
          ...nextRecords,
          [semId]: savedSem,
        };
      }

      setStudentProfile(savedProfile);
      setSemesterRecords(nextRecords);
      setLocalAccounts(listLocalAccounts());
      setActiveDashboardSection('my-roadmap');
    } catch (err) {
      console.error('Failed to start new semester:', err);
      setStorageError('Could not start the new semester. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * ==========================================================================
   * HANDLER 8: Google Cloud Sign-In & Local Account Switching
   * ==========================================================================
   */
  const handleSignInGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.warn('Google Sign-In popup closed or blocked:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentView('landing');
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  const handleSwitchLocalAccount = (targetUserId: string) => {
    setActiveLocalUserId(targetUserId);
    setLocalUserId(targetUserId);
  };

  const handleCreateNewLocalAccount = () => {
    const newId = createNewLocalAccountId();
    setLocalUserId(newId);
    setStudentProfile(null);
    setSemesterRecords({});
    setOnboardingResetKey((prev) => prev + 1);
    setCurrentView('onboarding');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        currentView={currentView}
        hasSavedProfile={Boolean(studentProfile)}
        isCloudAuthenticated={isCloudAuthenticated}
        userEmail={firebaseUser?.email}
        onStartOnboarding={handleStartFreshOnboarding}
        onOpenDashboard={() => {
          if (studentProfile) {
            setActiveDashboardSection(null);
            setIsEditingProfile(false);
            setCurrentView('dashboard');
          } else {
            handleStartFreshOnboarding();
          }
        }}
        onEditProfile={handleOpenEditProfile}
        onGoHome={() => setCurrentView('landing')}
        onSignOut={handleSignOut}
      />

      {/* Global Error Banner if a storage operation fails */}
      {storageError && (
        <div
          role="alert"
          className="bg-red-50 border-b border-red-200 px-6 py-3 text-xs font-medium text-red-800 flex items-center justify-between"
        >
          <span>{storageError}</span>
          <button
            type="button"
            onClick={() => setStorageError(null)}
            className="text-red-700 font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1">
        {isLoadingData ? (
          <div className="max-w-4xl mx-auto p-10 space-y-4">
            <div className="h-8 w-56 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-36 w-full bg-white border border-slate-200 rounded-2xl p-6 animate-pulse" />
          </div>
        ) : (
          <>
            {currentView === 'landing' && (
              <LandingPage
                onBuildRoadmap={handleStartFreshOnboarding}
                hasSavedProfile={Boolean(studentProfile)}
                onResumeDashboard={() => {
                  setActiveDashboardSection(null);
                  setIsEditingProfile(false);
                  setCurrentView('dashboard');
                }}
                studentName={studentProfile?.fullName}
              />
            )}

            {currentView === 'onboarding' && (
              <OnboardingForm
                key={`onboarding_fresh_${onboardingResetKey}`}
                mode="onboarding"
                activeUserId={effectiveUserId}
                initialProfile={studentProfile}
                hasExistingSavedData={Boolean(studentProfile)}
                isSaving={isSaving}
                onSaveProfile={handleCompleteOnboarding}
                onCancel={() => {
                  // Leaving or cancelling onboarding NEVER overwrites existing saved data!
                  if (studentProfile) {
                    setActiveDashboardSection(null);
                    setCurrentView('dashboard');
                  } else {
                    setCurrentView('landing');
                  }
                }}
              />
            )}

            {currentView === 'dashboard' && studentProfile && (
              <Dashboard
                profile={studentProfile}
                semesterRecords={semesterRecords}
                activeSection={activeDashboardSection}
                onSelectSection={setActiveDashboardSection}
                isEditingProfile={isEditingProfile}
                onSetEditingProfile={setIsEditingProfile}
                isCloudAuthenticated={isCloudAuthenticated}
                cloudUserEmail={firebaseUser?.email}
                localAccounts={localAccounts}
                onSwitchLocalAccount={handleSwitchLocalAccount}
                onCreateNewLocalAccount={handleCreateNewLocalAccount}
                onSignInGoogle={handleSignInGoogle}
                onSignOut={handleSignOut}
                onSaveProfileEdits={handleSaveProfileEdits}
                onUpdateSemesterRecord={handleUpdateSemesterRecord}
                onRegenerateSemesterRoadmap={handleRegenerateSemesterRoadmap}
                onStartNewSemester={handleStartNewSemester}
                isSaving={isSaving}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
