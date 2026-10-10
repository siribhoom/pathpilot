/**
 * ============================================================================
 * FILE: src/components/LandingPage.tsx
 * PURPOSE: Displays the PathPilot landing page with its core value proposition,
 *          tagline ("From Classroom Concepts to Career-Ready Skills."),
 *          an interactive Subject-to-Real-World Application preview across BTech
 *          branches, and the primary "Build My Roadmap" CTA button.
 *
 * BEGINNER CONCEPT — Local UI State (`useState`):
 * Even on a landing page, we can make the interface interactive using React's
 * `useState` hook. Below, `selectedPreviewBranch` remembers which BTech branch
 * the visitor clicked in the "Subject Bridge Preview" box so they can see how
 * PathPilot connects theory to real engineering systems for CSE, ECE, Mechanical,
 * Civil, EEE, or IT before they even fill out the onboarding form.
 * ============================================================================
 */

import React, { useState } from 'react';
import { ArrowRight, BookOpen, Compass, Layers, CalendarClock, CheckCircle2 } from 'lucide-react';
import {
  BRANCH_OPTIONS,
  BRANCH_SUGGESTIONS,
  DASHBOARD_SECTIONS,
  EngineeringBranch,
} from '../types/student';

interface LandingPageProps {
  onBuildRoadmap: () => void;
  hasSavedProfile: boolean;
  onResumeDashboard: () => void;
  studentName?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onBuildRoadmap,
  hasSavedProfile,
  onResumeDashboard,
  studentName,
}) => {
  // Local state for the interactive Subject-to-Real-World preview card in the hero section
  const [selectedPreviewBranch, setSelectedPreviewBranch] = useState<EngineeringBranch>('CSE');

  // Look up the sample subject bridge data for the currently selected preview branch
  const activePreview = BRANCH_SUGGESTIONS[selectedPreviewBranch];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* =====================================================================
          SECTION 1: HERO SECTION
          Displays PathPilot's title, tagline, platform explanation, primary CTA,
          and an interactive live preview of the Subject-to-Application bridge.
          ===================================================================== */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-20 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Left Column: Brand Story, Tagline, Explanation & Primary CTA */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Quiet unboxed metadata line */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span>BTech Academic-to-Career Planner</span>
                <span aria-hidden="true">·</span>
                <span>All Engineering Branches</span>
                <span aria-hidden="true">·</span>
                <span>Year 1 to Year 4</span>
              </div>

              {/* Main Brand Headline & Mandatory Tagline */}
              <div className="space-y-3">
                <p className="text-sm font-semibold tracking-tight text-blue-700">
                  PathPilot — Your BTech Journey, Planned Smartly
                </p>
                <h1
                  className="text-4xl sm:text-5xl lg:text-[3.35rem] font-bold tracking-tight text-slate-950 leading-[1.12]"
                  style={{ textWrap: 'balance' }}
                >
                  From Classroom Concepts to Career-Ready Skills.
                </h1>
              </div>

              {/* Platform Explanation */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Most students treat college exams and career preparation as two separate worlds.{' '}
                <strong className="font-semibold text-slate-900">PathPilot</strong> bridges that gap:
                we connect the exact BTech subjects on your semester syllabus to real-world
                engineering applications, map out relevant technical skills and portfolio projects,
                rearrange your study timetable when exams or missed weeks happen, and guide your
                placement readiness year by year.
              </p>
            </div>

            {/* Primary CTA Controls */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onBuildRoadmap}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white bg-blue-700 rounded-xl hover:bg-blue-800 active:translate-y-px transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Build My Roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {hasSavedProfile && (
                  <button
                    type="button"
                    onClick={onResumeDashboard}
                    className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Resume {studentName ? `${studentName}'s` : 'Saved'} Dashboard</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500">
                Takes under 60 seconds · Supports CSE, IT, ECE, EEE, Mechanical, Civil & specialized branches
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Subject-to-Real-World Application Bridge Preview */}
          <div
            id="subject-bridge"
            className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Interactive Differentiator Preview
                  </p>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    Subject-to-Real-World Bridge
                  </h2>
                </div>
                <Compass className="w-5 h-5 text-blue-700 shrink-0" />
              </div>

              {/* Interactive Branch Filter Tabs (Functional segmented buttons) */}
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Select an engineering branch to inspect how syllabus theory connects to industry:
                </p>
                <div
                  role="tablist"
                  aria-label="Preview Engineering Branches"
                  className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg"
                >
                  {(['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT'] as EngineeringBranch[]).map(
                    (branch) => (
                      <button
                        key={branch}
                        type="button"
                        role="tab"
                        aria-selected={selectedPreviewBranch === branch}
                        onClick={() => setSelectedPreviewBranch(branch)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          selectedPreviewBranch === branch
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {branch}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* 3-Step Chain: Classroom Subject -> Real-World System -> Career Skill */}
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>01. College Syllabus Subject</span>
                    <span className="font-mono tabular-nums">{selectedPreviewBranch} Core</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {activePreview.sampleBridge.subject}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Classroom focus: {activePreview.sampleBridge.classroomConcept}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>02. Real-World Engineering Application</span>
                    <span>Production System</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {activePreview.sampleBridge.realWorldSystem}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                  <div className="flex items-center justify-between text-xs text-blue-800 mb-1">
                    <span>03. Career-Ready Skill Unlocked</span>
                    <span>Placement Asset</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {activePreview.sampleBridge.industrySkill}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Not a generic checklist — grounded in your syllabus</span>
              <button
                type="button"
                onClick={onBuildRoadmap}
                className="font-semibold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                Map your subjects →
              </button>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Engineering Value Strip Below Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-10 border-t border-slate-200">
          <div>
            <p className="text-xs font-medium text-slate-500">Academic Alignment</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              8 Semesters
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Structured from 1st-year fundamentals to 4th-year placement readiness.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Branch Coverage</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              7+ Branches
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Dedicated tracks for CSE, IT, ECE, EEE, Mechanical, Civil, and allied fields.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Core Differentiator</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              Theory → System
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Every semester subject is paired with its real industrial engineering application.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Adaptive Planning</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              Flexible Hours
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Designed around your realistic weekly study hours and preferred learning style.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: HOW PATHPILOT WORKS
          Explains the step-by-step workflow clearly.
          ===================================================================== */}
      <section id="how-it-works" className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold text-blue-700">How PathPilot Works</p>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2"
              style={{ textWrap: 'balance' }}
            >
              An engineering roadmap that respects your college timetable
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              Instead of overwhelming you with random online courses, PathPilot starts with what you
              are already studying in college this semester and builds outward toward your career goal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-blue-700">01. ONBOARD</span>
                  <BookOpen className="w-4 h-4 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Enter Your Semester & Subjects
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tell PathPilot your branch, current year, semester, active college subjects,
                  existing skills, and how many hours per week you can realistically study.
                </p>
              </div>
              <p className="text-xs text-slate-500 pt-6 mt-6 border-t border-slate-200/80">
                Input validated for realistic weekly study schedules
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-blue-700">02. CONNECT</span>
                  <Layers className="w-4 h-4 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Link Subjects to Real Applications
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  See how classroom theory—from Thermodynamics and Control Systems to Data Structures
                  and VLSI—powers actual industrial hardware and software products.
                </p>
              </div>
              <p className="text-xs text-slate-500 pt-6 mt-6 border-t border-slate-200/80">
                Turn semester exam study time into interview depth
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-blue-700">03. ADAPT & GROW</span>
                  <CalendarClock className="w-4 h-4 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Track Progress & Rearrange Timetable
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Build projects, discover internships & hackathons, and rearrange your study
                  timetable smoothly whenever mid-sem exams or lab submissions cause missed weeks.
                </p>
              </div>
              <p className="text-xs text-slate-500 pt-6 mt-6 border-t border-slate-200/80">
                Year-by-year progression toward final placements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: MULTI-BRANCH COVERAGE
          Shows students from core and software branches that PathPilot is built for them.
          ===================================================================== */}
      <section id="branches" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-700">Built for Every BTech Department</p>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1"
              style={{ textWrap: 'balance' }}
            >
              Core Engineering & Software Pathways
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Whether you are designing structural trusses, tuning PID controllers, or building
            distributed backend systems, PathPilot adapts to your curriculum.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BRANCH_OPTIONS.slice(0, 6).map((branchItem) => {
            const details = BRANCH_SUGGESTIONS[branchItem.value];
            return (
              <div
                key={branchItem.value}
                className="p-6 bg-white border border-slate-200 rounded-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-900">
                      {branchItem.value}
                    </span>
                    <span>BTech Curriculum</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{branchItem.label}</h3>
                  <p className="text-xs text-slate-600">{branchItem.coreFocus}</p>
                </div>

                <div className="pt-4 mt-5 border-t border-slate-100 space-y-1.5">
                  <p className="text-xs font-medium text-slate-500">Sample Bridge:</p>
                  <p className="text-xs text-slate-800">
                    <span className="font-semibold">{details.sampleBridge.subject}</span> →{' '}
                    {details.sampleBridge.realWorldSystem}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: THE 7 PLATFORM MODULES
          Previews the 7 workspace sections the student unlocks after onboarding.
          ===================================================================== */}
      <section id="modules" className="bg-white border-t border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold text-blue-700">Unified Workspace Architecture</p>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1"
              style={{ textWrap: 'balance' }}
            >
              Seven Integrated Modules Inside Your Dashboard
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Complete your 60-second onboarding profile to unlock your personalized PathPilot
              dashboard organized around these seven pillars:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DASHBOARD_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <span className="text-xs font-mono font-semibold text-blue-700">
                    {section.number}. {section.shortLabel}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {section.summary}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200/70 flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span className="truncate">Uses: {section.dataInputsUsed.slice(0, 2).join(' · ')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Conversion Banner */}
          <div className="mt-14 p-8 sm:p-10 rounded-2xl bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Ready to map your current semester to your engineering career?
              </h3>
              <p className="text-sm text-slate-300">
                Set up your student profile now to initialize your personalized PathPilot dashboard.
              </p>
            </div>
            <button
              type="button"
              onClick={onBuildRoadmap}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-950 bg-white rounded-xl hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Build My Roadmap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-800">PathPilot</span> · From Classroom Concepts to Career-Ready Skills
          </div>
          <div>
            Version 1 Foundation · Local Session State Mode
          </div>
        </div>
      </footer>
    </div>
  );
};
