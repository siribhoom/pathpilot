/**
 * ============================================================================
 * FILE: src/components/Navbar.tsx
 * PURPOSE: Renders the top navigation header across the application.
 *
 * BEGINNER CONCEPT — React Props & Event Callbacks:
 * A component receives inputs called "props" (properties) from its parent
 * (`App.tsx`). Here, `Navbar` receives:
 * - `currentView`: Which screen is currently active ('landing' | 'onboarding' | 'dashboard')
 * - `hasSavedProfile`: Whether the student has already submitted valid onboarding data
 * - `onStartOnboarding`: A callback function triggered when the user clicks "Build My Roadmap"
 * - `onOpenDashboard`: A callback function to jump back to the Dashboard if already onboarded
 * - `onGoHome`: A callback function to return to the Landing Page
 * ============================================================================
 */

import React from 'react';

interface NavbarProps {
  currentView: 'landing' | 'onboarding' | 'dashboard';
  hasSavedProfile: boolean;
  onStartOnboarding: () => void;
  onOpenDashboard: () => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  hasSavedProfile,
  onStartOnboarding,
  onOpenDashboard,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      {/* Zone 1: Brand Wordmark (single clean element) */}
      <button
        type="button"
        onClick={onGoHome}
        className="text-lg font-bold tracking-tight text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        PathPilot
      </button>

      {/* Zone 2: Concise single-line navigation links */}
      <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        {currentView === 'landing' ? (
          <>
            <a
              href="#subject-bridge"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Subject Bridge
            </a>
            <a
              href="#how-it-works"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#branches"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              All Branches
            </a>
            <a
              href="#modules"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              7 Modules
            </a>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onGoHome}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Landing Page
            </button>
            <button
              type="button"
              onClick={onStartOnboarding}
              className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'onboarding' ? 'text-blue-700 font-semibold' : ''
              }`}
            >
              {hasSavedProfile ? 'Edit Profile' : 'Onboarding Form'}
            </button>
            {hasSavedProfile && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  currentView === 'dashboard' ? 'text-blue-700 font-semibold' : ''
                }`}
              >
                My Dashboard
              </button>
            )}
          </>
        )}
      </nav>

      {/* Zone 3: Primary Action CTA */}
      <div className="flex items-center gap-3 shrink-0">
        {currentView === 'dashboard' ? (
          <button
            type="button"
            onClick={onStartOnboarding}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Edit Profile
          </button>
        ) : hasSavedProfile && currentView === 'landing' ? (
          <button
            type="button"
            onClick={onOpenDashboard}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Open My Dashboard
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartOnboarding}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Build My Roadmap
          </button>
        )}
      </div>
    </header>
  );
};
