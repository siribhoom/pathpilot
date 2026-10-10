/**
 * ============================================================================
 * FILE: src/components/LandingPage.tsx
 * PURPOSE: Displays the PathPilot landing page with its core value proposition,
 *          tagline ("From Classroom Concepts to Career-Ready Skills."),
 *          platform explanation, and the primary "Build My Roadmap" CTA button.
 *
 * BEGINNER CONCEPT — Component Props & Event Callbacks:
 * This component receives callback functions (`onBuildRoadmap`, `onResumeDashboard`)
 * and status flags (`hasSavedProfile`, `studentName`) from `App.tsx` via props.
 * When the student clicks "Build My Roadmap", `onBuildRoadmap()` notifies `App.tsx`
 * to switch the screen from the Landing Page to the Onboarding Form.
 * ============================================================================
 */

import React from 'react';
import { ArrowRight, BookOpen, Layers, CalendarClock } from 'lucide-react';

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
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      <div>
        {/* =====================================================================
            SECTION 1: HERO SECTION
            Displays PathPilot's title, tagline, platform explanation, and primary CTA.
            ===================================================================== */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-24">
          <div className="max-w-3xl space-y-8">
            <div className="space-y-6">
              {/* Quiet unboxed metadata line */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span>BTech Academic-to-Career Planner</span>
                <span aria-hidden="true">·</span>
                <span>Year 1 to Year 4</span>
              </div>

              {/* Main Brand Headline & Mandatory Tagline */}
              <div className="space-y-3">
                <p className="text-sm font-semibold tracking-tight text-blue-700">
                  PathPilot — Your BTech Journey, Planned Smartly
                </p>
                <h1
                  className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-950 leading-[1.12]"
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
                Takes under 60 seconds · Personalized to your current year, semester, and weekly study hours
              </p>
            </div>
          </div>

          {/* Full-Width 3-Column Engineering Value Strip Below Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 pt-10 border-t border-slate-200">
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
        <section id="how-it-works" className="bg-white border-t border-slate-200 py-20">
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
      </div>

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
