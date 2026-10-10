/**
 * ============================================================================
 * FILE: src/App.tsx
 * PURPOSE: Root application component that coordinates navigation and holds
 *          the student's onboarding profile state.
 *
 * BEGINNER CONCEPTS EXPLAINED IN THIS FILE:
 * 1. Top-Level State Management ("Lifting State Up"):
 *    Why do we store `studentProfile` here in `App.tsx` instead of inside
 *    `OnboardingForm.tsx`? Because both `OnboardingForm` (which writes the data)
 *    and `Dashboard` (which reads and displays the data) need access to it!
 *    In React, when two sibling components share data, we "lift the state up"
 *    to their closest common parent (`App.tsx`) and pass it down via props.
 *
 * 2. Temporary Local State vs. Persistent Database Storage:
 *    - In this Version 1 foundation, `studentProfile` is stored in React's
 *      in-memory `useState` and mirrored to the browser's `localStorage` under
 *      the key `'pathpilot_v1_student_profile'`.
 *    - What is the difference? Browser `localStorage` only lives on this single
 *      device and browser tab. In a future step, when we add authentication and
 *      a cloud database, the student's profile will be saved to a server so they
 *      can log in from any laptop or phone.
 *
 * 3. Defensive Error Handling (`try / catch`):
 *    Whenever we read JSON from `localStorage`, there is a chance a user or
 *    browser extension modified or corrupted the stored string, or that private
 *    browsing mode blocks storage access. Wrapping `JSON.parse` in a `try / catch`
 *    block prevents the entire app from crashing with a blank white screen.
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { OnboardingForm } from './components/OnboardingForm';
import { Dashboard } from './components/Dashboard';
import { StudentProfile } from './types/student';

// Key used to store the temporary Version 1 profile in the browser's localStorage
const LOCAL_STORAGE_KEY = 'pathpilot_v1_student_profile';

// Possible top-level screens in Version 1
type AppView = 'landing' | 'onboarding' | 'dashboard';

export default function App() {
  /**
   * 1. Student Profile State:
   * Uses a lazy initializer function `() => { ... }` so React only reads from
   * `localStorage` once when the app first loads, rather than on every re-render.
   */
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => {
    try {
      const savedJson = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!savedJson) {
        return null;
      }
      const parsed = JSON.parse(savedJson) as StudentProfile;
      // Basic sanity check to protect against malformed stored objects
      if (parsed && typeof parsed.fullName === 'string' && Array.isArray(parsed.currentSubjects)) {
        return parsed;
      }
      return null;
    } catch (error) {
      // If localStorage is blocked or corrupted, fall back safely to null
      console.warn('Could not read saved student profile from localStorage:', error);
      return null;
    }
  });

  /**
   * 2. Current View State:
   * Controls which of the 3 primary screens is currently visible to the user:
   * - `'landing'`: The marketing & educational landing page
   * - `'onboarding'`: The validated student onboarding form
   * - `'dashboard'`: The personalized student workspace with 7 module sections
   */
  const [currentView, setCurrentView] = useState<AppView>('landing');

  /**
   * Scroll smoothly to the top of the window whenever the user switches between
   * the Landing Page, Onboarding Form, and Dashboard.
   */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  /**
   * Event Handler: Called by `OnboardingForm` ONLY after all validation rules pass.
   * Saves the validated profile into React state and local browser storage,
   * then navigates directly to the personalized Dashboard.
   */
  const handleCompleteOnboarding = (validatedProfile: StudentProfile) => {
    setStudentProfile(validatedProfile);

    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validatedProfile));
    } catch (error) {
      console.warn('Could not persist profile to localStorage:', error);
    }

    setCurrentView('dashboard');
  };

  /**
   * Event Handler: Clears the temporary local profile and returns to the Landing Page
   * so the user can test onboarding from a completely fresh state.
   */
  const handleResetProfile = () => {
    setStudentProfile(null);
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.warn('Could not clear profile from localStorage:', error);
    }
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Navigation shared across views */}
      <Navbar
        currentView={currentView}
        hasSavedProfile={Boolean(studentProfile)}
        onStartOnboarding={() => setCurrentView('onboarding')}
        onOpenDashboard={() => {
          if (studentProfile) {
            setCurrentView('dashboard');
          } else {
            setCurrentView('onboarding');
          }
        }}
        onGoHome={() => setCurrentView('landing')}
      />

      {/* Main View Switcher */}
      <div className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onBuildRoadmap={() => setCurrentView('onboarding')}
            hasSavedProfile={Boolean(studentProfile)}
            onResumeDashboard={() => setCurrentView('dashboard')}
            studentName={studentProfile?.fullName}
          />
        )}

        {currentView === 'onboarding' && (
          <OnboardingForm
            initialProfile={studentProfile}
            onCompleteOnboarding={handleCompleteOnboarding}
            onCancel={() => {
              // If the student was editing an existing profile, return to Dashboard;
              // otherwise return to the Landing Page.
              if (studentProfile) {
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
            onEditProfile={() => setCurrentView('onboarding')}
            onResetProfile={handleResetProfile}
          />
        )}
      </div>
    </div>
  );
}
