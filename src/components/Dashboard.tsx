/**
 * ============================================================================
 * FILE: src/components/Dashboard.tsx
 * PURPOSE: Displays the personalized student dashboard after valid onboarding,
 *          including a personal greeting, submitted profile summary, sidebar
 *          navigation for the 7 required PathPilot modules, and honest
 *          architectural placeholders explaining how each section will work in
 *          future versions.
 *
 * BEGINNER CONCEPTS DEMONSTRATED IN THIS COMPONENT:
 * 1. Receiving Validated Data via Props (`profile: StudentProfile`):
 *    `Dashboard` does not need to worry about missing names or invalid study
 *    hours because `OnboardingForm` and `validateOnboardingForm` already
 *    guaranteed that `profile` satisfies the `StudentProfile` interface.
 *
 * 2. Section Navigation via State (`activeSection`):
 *    Instead of reloading the browser page when clicking sidebar items like
 *    "My Roadmap" or "Subject-to-Real-World Applications", we store the
 *    currently selected section ID in `activeSection`. Clicking a nav button
 *    updates `activeSection`, and React smoothly renders the corresponding panel.
 *
 * 3. Graceful Empty-Value Handling:
 *    Notice how `profile.knownSkills` is rendered: if the student left "Skills
 *    Already Known" blank during onboarding, `profile.knownSkills.length === 0`.
 *    We check for this condition and display a welcoming beginner message instead
 *    of rendering an empty box or crashing.
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  CalendarClock,
  Code2,
  Compass,
  Edit3,
  FolderGit2,
  GraduationCap,
  LayoutDashboard,
  RotateCcw,
} from 'lucide-react';
import {
  BRANCH_SUGGESTIONS,
  DASHBOARD_SECTIONS,
  DashboardSectionId,
  StudentProfile,
} from '../types/student';

interface DashboardProps {
  profile: StudentProfile;
  onEditProfile: () => void;
  onResetProfile: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  onEditProfile,
  onResetProfile,
}) => {
  /**
   * Tracks which dashboard view is currently displayed in the main content area.
   * Defaults to `'overview'` so the student sees their personalized greeting,
   * submitted profile summary, and quick cards to jump into any of the 7 modules.
   */
  const [activeSection, setActiveSection] = useState<DashboardSectionId>('overview');

  // Format display name of branch (handles 'Other' with custom branch name)
  const displayBranch =
    profile.branch === 'Other' && profile.customBranchName
      ? `${profile.customBranchName} (Other)`
      : profile.branch;

  // Retrieve sample bridge data for the student's branch
  const branchReference = BRANCH_SUGGESTIONS[profile.branch];

  // Find metadata if one of the 7 numbered modules is active
  const currentSectionMeta = DASHBOARD_SECTIONS.find((sec) => sec.id === activeSection);

  // Map each section ID to a clean functional icon for navigation affordance
  const getSectionIcon = (id: DashboardSectionId) => {
    switch (id) {
      case 'overview':
        return <LayoutDashboard className="w-4 h-4 shrink-0" />;
      case 'my-roadmap':
        return <Compass className="w-4 h-4 shrink-0" />;
      case 'subject-applications':
        return <BookOpen className="w-4 h-4 shrink-0" />;
      case 'skills':
        return <Code2 className="w-4 h-4 shrink-0" />;
      case 'projects':
        return <FolderGit2 className="w-4 h-4 shrink-0" />;
      case 'internships-hackathons':
        return <Briefcase className="w-4 h-4 shrink-0" />;
      case 'progress-tracker':
        return <CalendarClock className="w-4 h-4 shrink-0" />;
      case 'placement-prep':
        return <GraduationCap className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* =====================================================================
          LEFT SIDEBAR NAVIGATION (Desktop 272px fixed width, Mobile scrollable bar)
          Provides direct access to the Dashboard Overview and all 7 required sections.
          ===================================================================== */}
      <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 shrink-0 flex flex-col justify-between">
        <div className="p-4 sm:p-6">
          {/* Student Context Summary in Sidebar */}
          <div className="pb-4 mb-4 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-500">Active Student Workspace</p>
            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
              {profile.fullName}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
              <span className="font-mono font-semibold text-blue-700">{displayBranch}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.currentYear}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.currentSemester}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Dashboard Modules" className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                activeSection === 'overview'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                {getSectionIcon('overview')}
                <span className="truncate">Dashboard Overview</span>
              </span>
            </button>

            <div className="pt-3 pb-1 px-3">
              <p className="text-[11px] font-semibold text-slate-400">
                7 Core Platform Modules
              </p>
            </div>

            {DASHBOARD_SECTIONS.map((section) => {
              const isSelected = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium rounded-xl transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-700 text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    {getSectionIcon(section.id)}
                    <span className="truncate">{section.title}</span>
                  </span>
                  <span
                    className={`text-[11px] font-mono tabular-nums shrink-0 ${
                      isSelected ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {section.number}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls: Edit Profile & Reset */}
        <div className="p-4 sm:p-6 border-t border-slate-200 space-y-2 bg-slate-50/50">
          <button
            type="button"
            onClick={onEditProfile}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Student Profile</span>
          </button>
          <button
            type="button"
            onClick={onResetProfile}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Onboarding Data</span>
          </button>
        </div>
      </aside>

      {/* =====================================================================
          MAIN DASHBOARD VIEWPORT
          Renders the personalized greeting header + either the Overview screen
          or the selected module's detailed Version 1 Placeholder view.
          ===================================================================== */}
      <main className="flex-1 min-w-0 p-6 sm:p-10 max-w-6xl">
        {/* Personalized Greeting & Breadcrumb Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span>PathPilot Workspace</span>
                <span aria-hidden="true">/</span>
                <span className="text-blue-700 font-semibold">
                  {activeSection === 'overview'
                    ? 'Dashboard Overview'
                    : currentSectionMeta?.title}
                </span>
              </div>

              {/* Greeting the student by name and showing selected branch, year, and semester */}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Welcome, {profile.fullName}
              </h1>

              <p className="text-sm text-slate-600">
                BTech <strong className="font-semibold text-slate-900">{displayBranch}</strong>
                {' · '}
                <strong className="font-semibold text-slate-900">{profile.currentYear}</strong>
                {' ('}
                <strong className="font-semibold text-slate-900">{profile.currentSemester}</strong>
                {') · Target Goal: '}
                <strong className="font-semibold text-blue-700">{profile.careerGoal}</strong>
              </p>
            </div>

            {/* Action buttons to return to Dashboard Overview or Edit Profile */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {activeSection !== 'overview' && (
                <button
                  type="button"
                  onClick={() => setActiveSection('overview')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Dashboard Overview</span>
                </button>
              )}

              <button
                type="button"
                onClick={onEditProfile}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-xl hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* 4-Column Metric Strip Displaying Submitted Student Parameters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Branch & Stage</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {displayBranch} · {profile.currentSemester}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Active Semester Subjects</p>
              <p className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {profile.currentSubjects.length} Subject{profile.currentSubjects.length === 1 ? '' : 's'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Weekly Study Budget</p>
              <p className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {profile.weeklyStudyHours} hrs / week
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Preferred Learning Mode</p>
              <p className="text-sm font-bold text-slate-900 truncate mt-0.5" title={profile.preferredLearningMethod}>
                {profile.preferredLearningMethod}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================
            CONDITIONAL RENDERING:
            If `activeSection === 'overview'`, show the full Student Profile
            Summary + cards to open any of the 7 sections.
            Otherwise, show the dedicated Version 1 Placeholder view for the
            selected section.
            =================================================================== */}
        {activeSection === 'overview' ? (
          <div className="space-y-8">
            {/* Submitted Onboarding Data Summary Grid */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Your Submitted Engineering Profile
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This data is currently held in local browser state and powers all 7 dashboard modules below.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  Saved {new Date(profile.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Academic Subjects List */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    Current Semester Subjects ({profile.currentSubjects.length})
                  </p>
                  <ul className="space-y-1.5 text-sm font-medium text-slate-900">
                    {profile.currentSubjects.map((subject, index) => (
                      <li key={subject} className="flex items-baseline gap-2">
                        <span className="text-xs font-mono tabular-nums text-blue-700">
                          0{index + 1}.
                        </span>
                        <span>{subject}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Known Skills & Career Target */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Skills Already Known ({profile.knownSkills.length})
                    </p>
                    {profile.knownSkills.length > 0 ? (
                      <p className="text-sm font-medium text-slate-900 leading-relaxed">
                        {profile.knownSkills.join(' · ')}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-600 italic">
                        No prior skills listed yet — your roadmap will start from foundational beginner concepts.
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Target Career Field & Study Style
                    </p>
                    <p className="text-sm font-bold text-slate-900">{profile.careerGoal}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {profile.weeklyStudyHours} hours/week via {profile.preferredLearningMethod}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Directory of the 7 Dashboard Sections */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Explore Your 7 PathPilot Modules
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Select any section below (or in the left sidebar) to inspect how your submitted
                  profile connects to each planned module.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {DASHBOARD_SECTIONS.map((section) => (
                  <div
                    key={section.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between hover:border-blue-400 transition-colors"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono font-semibold text-blue-700">
                          Module {section.number}
                        </span>
                        <span>Version 1 Blueprint Ready</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {section.summary}
                      </p>
                    </div>

                    <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500 truncate">
                        Inputs: {section.dataInputsUsed.join(' · ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Open Section →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* =================================================================
             INDIVIDUAL SECTION PLACEHOLDER VIEW (Modules 01 through 07)
             Clearly labeled Version 1 placeholder explaining what will be
             implemented next and how the student's actual submitted inputs
             connect to this module.
             ================================================================= */
          currentSectionMeta && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-8">
              {/* Honest Version 1 Placeholder Banner */}
              <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-amber-900">
                    Version 1 Architectural Placeholder · Module {currentSectionMeta.number}: {currentSectionMeta.title}
                  </p>
                  <p className="text-xs text-amber-800">
                    This section is a clearly labeled foundation placeholder. Interactive generation, database persistence, and AI synthesis for this module will be implemented in upcoming iterations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('overview')}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-950 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  ← Back to Overview
                </button>
              </div>

              {/* Section Header & Purpose */}
              <div className="space-y-2 border-b border-slate-200 pb-6">
                <p className="text-xs font-mono font-semibold text-blue-700">
                  MODULE {currentSectionMeta.number} OF 07
                </p>
                <h2 className="text-2xl font-bold text-slate-900">
                  {currentSectionMeta.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 max-w-3xl">
                  {currentSectionMeta.summary}
                </p>
              </div>

              {/* Personalized Data Wiring Preview: Shows how THIS student's inputs feed this module */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: How Your Submitted Profile Connects Here */}
                <div className="lg:col-span-5 p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Your Connected Onboarding Inputs
                  </h3>
                  <p className="text-xs text-slate-600">
                    When we build the logic for <strong>{currentSectionMeta.title}</strong>, it will read these exact values from your profile:
                  </p>

                  <dl className="space-y-3 text-xs pt-2">
                    <div className="pb-2.5 border-b border-slate-200/80">
                      <dt className="text-slate-500">Student & Branch Context</dt>
                      <dd className="font-semibold text-slate-900 mt-0.5">
                        {profile.fullName} · {displayBranch} ({profile.currentYear}, {profile.currentSemester})
                      </dd>
                    </div>
                    <div className="pb-2.5 border-b border-slate-200/80">
                      <dt className="text-slate-500">Current Semester Subjects</dt>
                      <dd className="font-semibold text-slate-900 mt-0.5">
                        {profile.currentSubjects.join(', ')}
                      </dd>
                    </div>
                    <div className="pb-2.5 border-b border-slate-200/80">
                      <dt className="text-slate-500">Target Career Goal</dt>
                      <dd className="font-semibold text-blue-700 mt-0.5">
                        {profile.careerGoal}
                      </dd>
                    </div>
                    <div className="pb-2.5 border-b border-slate-200/80">
                      <dt className="text-slate-500">Skills Already Known</dt>
                      <dd className="font-semibold text-slate-900 mt-0.5">
                        {profile.knownSkills.length > 0
                          ? profile.knownSkills.join(', ')
                          : 'Beginner baseline (no prior skills entered)'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Study Capacity & Preferred Style</dt>
                      <dd className="font-semibold text-slate-900 mt-0.5">
                        {profile.weeklyStudyHours} hours/week · {profile.preferredLearningMethod}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Right Column: What Will Be Implemented in Phase 2 */}
                <div className="lg:col-span-7 p-6 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      What Will Be Implemented Here in Version 2
                    </h3>
                    <ul className="space-y-3">
                      {currentSectionMeta.plannedCapabilities.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                          <span className="font-mono font-semibold text-blue-700 shrink-0 mt-0.5">
                            0{idx + 1}.
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Section-Specific Contextual Preview */}
                    {activeSection === 'subject-applications' && (
                      <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                        <p className="text-xs font-bold text-blue-900">
                          Preview for {displayBranch} Subjects:
                        </p>
                        <p className="text-xs text-slate-700">
                          Each of your {profile.currentSubjects.length} listed subjects ({profile.currentSubjects.slice(0, 3).join(', ')}
                          {profile.currentSubjects.length > 3 ? '...' : ''}) will be mapped to industrial architectures—for example, showing how{' '}
                          <strong>{branchReference.sampleBridge.subject}</strong> powers{' '}
                          <strong>{branchReference.sampleBridge.realWorldSystem}</strong>.
                        </p>
                      </div>
                    )}

                    {activeSection === 'progress-tracker' && (
                      <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                        <p className="text-xs font-bold text-blue-900">
                          Adaptive Timetable Rearrangement Preview:
                        </p>
                        <p className="text-xs text-slate-700">
                          Calibrated to your <strong>{profile.weeklyStudyHours} hours/week</strong> schedule. When university mid-sems or lab exams cause you to miss planned sessions, this module will recalculate and redistribute missed blocks across future weeks without overwhelming you.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <strong className="text-slate-700">Next Step Blueprint:</strong>{' '}
                      {currentSectionMeta.futureInteractivePreview}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation Footer to switch sections or return to overview */}
              <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setActiveSection('overview')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Dashboard Overview</span>
                </button>

                <button
                  type="button"
                  onClick={onEditProfile}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update My Onboarding Inputs</span>
                </button>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
};
