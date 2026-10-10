/**
 * ============================================================================
 * FILE: src/components/Navbar.tsx
 * PURPOSE: Renders the top navigation header across the application following
 *          the 3-zone Top Bar Contract.
 * ============================================================================
 */

import React from 'react';

interface NavbarProps {
  currentView: 'landing' | 'onboarding' | 'dashboard';
  hasSavedProfile: boolean;
  isCloudAuthenticated: boolean;
  userEmail?: string | null;
  onStartOnboarding: () => void;
  onOpenDashboard: () => void;
  onEditProfile?: () => void;
  onGoHome: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  hasSavedProfile,
  isCloudAuthenticated,
  onStartOnboarding,
  onOpenDashboard,
  onGoHome,
  onSignOut,
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
      <nav
        aria-label="Primary Navigation"
        className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
      >
        {currentView === 'landing' ? (
          <>
            <a
              href="#how-it-works"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <button
              type="button"
              onClick={onStartOnboarding}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Build My Roadmap
            </button>
            {hasSavedProfile && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                My Dashboard
              </button>
            )}
            {isCloudAuthenticated && (
              <button
                type="button"
                onClick={onSignOut}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign Out
              </button>
            )}
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
              New Onboarding
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
            {isCloudAuthenticated && (
              <button
                type="button"
                onClick={onSignOut}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </>
        )}
      </nav>

      {/* Zone 3: 1 Primary Action CTA */}
      <div className="flex items-center gap-3 shrink-0">
        {hasSavedProfile && currentView === 'landing' ? (
          <button
            type="button"
            onClick={onOpenDashboard}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Open My Dashboard
          </button>
        ) : currentView === 'landing' || currentView === 'onboarding' ? (
          <button
            type="button"
            onClick={onStartOnboarding}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Build My Roadmap
          </button>
        ) : isCloudAuthenticated ? (
          <button
            type="button"
            onClick={onSignOut}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign Out
          </button>
        ) : null}
      </div>
    </header>
  );
};
