/**
 * ============================================================================
 * FILE: src/components/Dashboard.tsx
 * PURPOSE: Renders the personalized student workspace organized into the 5
 *          functional sections:
 *          1. My Profile
 *          2. My Roadmap
 *          3. My Projects
 *          4. My Opportunities
 *          5. My Progress
 *
 * BEGINNER CONCEPTS EXPLAINED IN THIS FILE:
 * 1. Semester-Wise Data Organization:
 *    Instead of storing one flat list of tasks, `semesterRecords` is a dictionary
 *    keyed by `semesterId` (e.g. `sem_1`, `sem_2`, `sem_4`). The state variable
 *    `viewedSemesterId` controls which semester the student is currently looking
 *    at. This lets the student view their current semester, revisit any previous
 *    semester, mark a semester complete, or start a new semester without ever
 *    losing previous records!
 *
 * 2. Explicit Save & Confirmation Guards:
 *    - Profile edits are only saved when the user clicks "Save Changes".
 *    - Marking a semester complete or regenerating a roadmap requires explicit
 *      user confirmation in a modal dialog so data is never accidentally lost.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  Cloud,
  Code2,
  Compass,
  Edit3,
  ExternalLink,
  FolderGit2,
  HardDrive,
  Info,
  Layers,
  Lock,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Target,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  AcademicSemester,
  BRANCH_SUGGESTIONS,
  DASHBOARD_NAVIGATION_SECTIONS,
  DashboardSectionId,
  OpportunityItem,
  SEMESTER_OPTIONS,
  SemesterRecord,
  SkillResourceItem,
  StudentProfile,
} from '../types/student';
import {
  calculateSemesterProgress,
  generatePersonalizedSemesterRecord,
  getAcademicYearForSemester,
  rearrangeMissedTimetable,
  semesterNameToId,
} from '../utils/roadmapGenerator';
import { parseCommaSeparatedList } from '../utils/validation';
import { LocalAccountSummary } from '../services/storageService';
import { OnboardingForm } from './OnboardingForm';

interface DashboardProps {
  profile: StudentProfile;
  semesterRecords: Record<string, SemesterRecord>;
  activeSection: DashboardSectionId | null;
  onSelectSection: (section: DashboardSectionId | null) => void;
  isEditingProfile: boolean;
  onSetEditingProfile: (editing: boolean) => void;
  isCloudAuthenticated: boolean;
  cloudUserEmail?: string | null;
  localAccounts: LocalAccountSummary[];
  onSwitchLocalAccount: (userId: string) => void;
  onCreateNewLocalAccount: () => void;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onSaveProfileEdits: (updatedProfile: StudentProfile) => Promise<void>;
  onUpdateSemesterRecord: (updatedRecord: SemesterRecord) => Promise<void>;
  onRegenerateSemesterRoadmap: (semesterName: AcademicSemester, subjects: string[]) => Promise<void>;
  onStartNewSemester: (semesterName: AcademicSemester, subjects: string[]) => Promise<void>;
  isSaving: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  semesterRecords,
  activeSection,
  onSelectSection,
  isEditingProfile,
  onSetEditingProfile,
  isCloudAuthenticated,
  cloudUserEmail,
  localAccounts,
  onSwitchLocalAccount,
  onCreateNewLocalAccount,
  onSignInGoogle,
  onSignOut,
  onSaveProfileEdits,
  onUpdateSemesterRecord,
  onRegenerateSemesterRoadmap,
  onStartNewSemester,
  isSaving,
}) => {
  /**
   * Tracks which semester's record is currently displayed across My Roadmap,
   * My Skills, My Projects, My Opportunities, and My Progress.
   * Defaults to the student's current active semester.
   */
  const [viewedSemesterId, setViewedSemesterId] = useState<string>(() =>
    semesterNameToId(profile.currentSemester)
  );

  // Sync viewedSemesterId when the student's currentSemester changes (e.g., starting a new semester)
  useEffect(() => {
    const targetId = semesterNameToId(profile.currentSemester);
    if (semesterRecords[targetId]) {
      setViewedSemesterId(targetId);
    }
  }, [profile.currentSemester, semesterRecords]);

  // Confirmation modal states
  const [showCompleteSemesterModal, setShowCompleteSemesterModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showStartSemesterModal, setShowStartSemesterModal] = useState(false);

  // Form state for starting a new semester
  const [newSemName, setNewSemName] = useState<AcademicSemester>('Semester 1');
  const [newSemSubjectsText, setNewSemSubjectsText] = useState<string>('');
  const [newSemError, setNewSemError] = useState<string>('');

  // Status feedback banner
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Skill filter state: all, known (baseline), recommended, in-progress, mastered
  const [skillFilter, setSkillFilter] = useState<'all' | 'known' | 'recommended' | 'in-progress' | 'mastered'>('all');
  // Opportunity filter state
  const [oppFilter, setOppFilter] = useState<'all' | 'Internship' | 'Hackathon' | 'Research / Open-Source'>('all');

  const triggerBanner = (msg: string) => {
    setStatusBanner(msg);
    window.setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // All saved semester records sorted chronologically (Semester 1 -> Semester 8)
  const sortedSemesters: SemesterRecord[] = (Object.values(semesterRecords) as SemesterRecord[]).sort(
    (a, b) => a.semesterName.localeCompare(b.semesterName)
  );

  // Fallback personalized record generated from the student's profile if storage has none yet
  const fallbackRecord: SemesterRecord = React.useMemo(() => {
    return generatePersonalizedSemesterRecord(profile, profile.currentSemester);
  }, [profile]);

  // The active semester record to display (guaranteed to never be undefined)
  const activeRecord: SemesterRecord =
    semesterRecords[viewedSemesterId] ||
    semesterRecords[semesterNameToId(profile.currentSemester)] ||
    sortedSemesters[0] ||
    fallbackRecord;

  // Single authoritative reference so all sections and subviews bind consistently
  const currentRecord: SemesterRecord = activeRecord;

  // Auto-persist activeRecord if it is not yet in storage
  useEffect(() => {
    if (!semesterRecords[activeRecord.semesterId]) {
      onUpdateSemesterRecord(activeRecord).catch((err) => {
        console.warn('Auto-saving initial semester record:', err);
      });
    }
  }, [activeRecord, semesterRecords, onUpdateSemesterRecord]);

  const isViewingCompletedSemester = activeRecord.status === 'completed';

  const displayBranch =
    profile.branch === 'Other' && profile.customBranchName
      ? `${profile.customBranchName} (Other)`
      : profile.branch;

  const getSectionIcon = (id: DashboardSectionId, className = 'w-4 h-4 shrink-0') => {
    switch (id) {
      case 'my-profile':
        return <UserCheck className={className} />;
      case 'my-roadmap':
        return <Compass className={className} />;
      case 'my-projects':
        return <FolderGit2 className={className} />;
      case 'my-opportunities':
        return <Briefcase className={className} />;
      case 'my-progress':
        return <CalendarClock className={className} />;
    }
  };

  /**
   * ==========================================================================
   * INTERACTIVE UPDATE HANDLERS FOR ROADMAP, SKILLS, PROJECTS & OPPORTUNITIES
   * Note: If a semester has been marked 'completed', its record is locked as
   * a permanent historical record so completed history cannot be accidentally erased.
   * ==========================================================================
   */

  const handleToggleWeeklyTask = async (weekId: string) => {
    if (isViewingCompletedSemester) return;
    const updatedWeeks = activeRecord.weeklyPlans.map((w) =>
      w.id === weekId ? { ...w, isCompleted: !w.isCompleted } : w
    );
    const updated: SemesterRecord = {
      ...activeRecord,
      weeklyPlans: updatedWeeks,
    };
    updated.progressPercent = calculateSemesterProgress(updated);
    await onUpdateSemesterRecord(updated);
  };

  const handleToggleMonthlyMilestone = async (monthId: string) => {
    if (isViewingCompletedSemester) return;
    const updatedMonths = activeRecord.monthlyPlans.map((m) =>
      m.id === monthId ? { ...m, isCompleted: !m.isCompleted } : m
    );
    const updated: SemesterRecord = {
      ...activeRecord,
      monthlyPlans: updatedMonths,
    };
    updated.progressPercent = calculateSemesterProgress(updated);
    await onUpdateSemesterRecord(updated);
  };

  const handleToggleThreeMonthMilestone = async () => {
    if (isViewingCompletedSemester || !activeRecord.threeMonthMilestone) return;
    const updated: SemesterRecord = {
      ...activeRecord,
      threeMonthMilestone: {
        ...activeRecord.threeMonthMilestone,
        isCompleted: !activeRecord.threeMonthMilestone.isCompleted,
      },
    };
    await onUpdateSemesterRecord(updated);
  };

  const handleToggleSubjectBridgeExplored = async (bridgeId: string) => {
    if (isViewingCompletedSemester) return;
    const updatedBridges = activeRecord.subjectBridges.map((b) =>
      b.id === bridgeId ? { ...b, isExplored: !b.isExplored } : b
    );
    const updated: SemesterRecord = {
      ...activeRecord,
      subjectBridges: updatedBridges,
    };
    await onUpdateSemesterRecord(updated);
  };

  const handleChangeSkillStatus = async (
    skillId: string,
    newStatus: SkillResourceItem['status']
  ) => {
    if (isViewingCompletedSemester) return;
    const updatedSkills = activeRecord.skills.map((s) =>
      s.id === skillId ? { ...s, status: newStatus } : s
    );
    const updated: SemesterRecord = {
      ...activeRecord,
      skills: updatedSkills,
    };
    updated.progressPercent = calculateSemesterProgress(updated);
    await onUpdateSemesterRecord(updated);
  };

  const handleToggleProjectMilestone = async (projectId: string, milestoneId: string) => {
    if (isViewingCompletedSemester) return;
    const updatedProjects = activeRecord.projects.map((proj) => {
      if (proj.id !== projectId) return proj;
      const nextMilestones = proj.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const completedCount = nextMilestones.filter((m) => m.completed).length;
      const progressPercent =
        nextMilestones.length > 0
          ? Math.round((completedCount / nextMilestones.length) * 100)
          : 0;
      const status: 'not-started' | 'in-progress' | 'completed' =
        progressPercent === 100
          ? 'completed'
          : progressPercent > 0
          ? 'in-progress'
          : 'not-started';

      return {
        ...proj,
        milestones: nextMilestones,
        progressPercent,
        status,
      };
    });

    const updated: SemesterRecord = {
      ...activeRecord,
      projects: updatedProjects,
    };
    updated.progressPercent = calculateSemesterProgress(updated);
    await onUpdateSemesterRecord(updated);
  };

  const handleChangeOpportunityStatus = async (
    oppId: string,
    newStatus: OpportunityItem['status']
  ) => {
    if (isViewingCompletedSemester) return;
    const updatedOpps = activeRecord.opportunities.map((o) =>
      o.id === oppId ? { ...o, status: newStatus } : o
    );
    const updated: SemesterRecord = {
      ...activeRecord,
      opportunities: updatedOpps,
    };
    await onUpdateSemesterRecord(updated);
  };

  const handleTogglePlacementTask = async (taskId: string) => {
    if (isViewingCompletedSemester) return;
    const updatedTasks = activeRecord.placementTasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updated: SemesterRecord = {
      ...activeRecord,
      placementTasks: updatedTasks,
    };
    updated.progressPercent = calculateSemesterProgress(updated);
    await onUpdateSemesterRecord(updated);
  };

  const handleRearrangeMissedWeek = async (weekNumber: number) => {
    if (isViewingCompletedSemester) return;
    const rearranged = rearrangeMissedTimetable(activeRecord, weekNumber);
    await onUpdateSemesterRecord(rearranged);
    triggerBanner(
      `Week ${weekNumber} tasks have been redistributed across upcoming weeks and saved.`
    );
  };

  const handleConfirmMarkSemesterComplete = async () => {
    const completedRecord: SemesterRecord = {
      ...activeRecord,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };
    await onUpdateSemesterRecord(completedRecord);
    setShowCompleteSemesterModal(false);
    triggerBanner(
      `${activeRecord.semesterName} has been marked complete and archived in My Profile.`
    );
  };

  const handleOpenStartNewSemesterModal = () => {
    // Suggest the next semester in sequence
    const currentIndex = SEMESTER_OPTIONS.indexOf(profile.currentSemester);
    const suggestedNext =
      currentIndex >= 0 && currentIndex < SEMESTER_OPTIONS.length - 1
        ? SEMESTER_OPTIONS[currentIndex + 1]
        : SEMESTER_OPTIONS[0];
    setNewSemName(suggestedNext);
    setNewSemSubjectsText(
      BRANCH_SUGGESTIONS[profile.branch].subjects.slice(0, 4).join(', ')
    );
    setNewSemError('');
    setShowStartSemesterModal(true);
  };

  const handleConfirmStartNewSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSubjects = parseCommaSeparatedList(newSemSubjectsText);
    if (parsedSubjects.length === 0) {
      setNewSemError('Please enter at least one subject for the new semester.');
      return;
    }
    await onStartNewSemester(newSemName, parsedSubjects);
    setViewedSemesterId(semesterNameToId(newSemName));
    setShowStartSemesterModal(false);
    triggerBanner(
      `Started ${newSemName}! Previous semester records remain safely preserved.`
    );
  };

  // Compute aggregate historical stats across all saved semesters for My Profile
  const completedSemestersList = sortedSemesters.filter((s) => s.status === 'completed');
  const allCompletedTasksCount = sortedSemesters.reduce(
    (sum, s) =>
      sum +
      s.weeklyPlans.filter((w) => w.isCompleted).length +
      s.placementTasks.filter((t) => t.completed).length,
    0
  );
  const allMasteredSkills = Array.from(
    new Set(
      sortedSemesters.flatMap((s) =>
        s.skills.filter((sk) => sk.status === 'mastered').map((sk) => sk.skillName)
      )
    )
  );
  const allCompletedProjects = sortedSemesters.flatMap((s) =>
    s.projects
      .filter((p) => p.status === 'completed' || p.progressPercent === 100)
      .map((p) => ({ ...p, semesterName: s.semesterName }))
  );

  /**
   * ============================================================================
   * DEFAULT DASHBOARD VIEW: ONLY FIVE BUTTONS
   * When the student clicks "My Dashboard" in the top navigation, activeSection is null.
   * As required:
   * 1. The dashboard main content area contains ONLY these five buttons:
   *    - My Profile
   *    - My Roadmap
   *    - My Projects
   *    - My Opportunities
   *    - My Progress
   * 2. All other elements (Student Workspace heading, semester switcher,
   *    Local Browser Mode banner, progress summaries, extra cards) are removed.
   * 3. Clicking any of the five buttons displays that section's content.
   * 4. Each opened section includes a working "Back to Dashboard" button.
   * ============================================================================
   */
  if (activeSection === null) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-slate-50 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-xl space-y-4">
          {DASHBOARD_NAVIGATION_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                onSetEditingProfile(false);
                onSelectSection(section.id);
              }}
              className="w-full flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-600 hover:bg-blue-50/40 hover:shadow-md transition-all duration-200 text-left cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  {getSectionIcon(section.id, 'w-6 h-6')}
                </div>
                <div>
                  <span className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-blue-900 transition-colors block">
                    {section.title}
                  </span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors hidden sm:block">
                    {section.description}
                  </span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-50 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-700 flex items-center justify-center transition-colors shrink-0 ml-3">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar for Section: Back to Dashboard button + Section Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              onSetEditingProfile(false);
              onSelectSection(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-blue-700 border border-slate-200 rounded-xl transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          {/* Quick switcher between the 5 dashboard sections */}
          <div className="flex flex-wrap items-center gap-1.5">
            {DASHBOARD_NAVIGATION_SECTIONS.map((sec) => {
              const isCurrent = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    onSetEditingProfile(false);
                    onSelectSection(sec.id);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {getSectionIcon(sec.id, 'w-3.5 h-3.5')}
                  <span>{sec.title}</span>
                </button>
              );
            })}
          </div>

          {/* Optional semester switcher & actions */}
          {sortedSemesters.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Semester:</span>
              <select
                aria-label="Select Viewed Semester"
                value={currentRecord?.semesterId || ''}
                onChange={(e) => setViewedSemesterId(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800"
              >
                {sortedSemesters.map((s) => (
                  <option key={s.semesterId} value={s.semesterId}>
                    {s.semesterName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Toast Banner */}
        {statusBanner && (
          <div
            role="status"
            className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center justify-between"
          >
            <span>{statusBanner}</span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-blue-700 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ===================================================================
            SECTION 1: MY PROFILE (`my-profile`)
            Displays saved student profile, Edit Profile / Save Changes mode,
            storage & account isolation controls, semester list, and completed
            records across previous semesters.
            =================================================================== */}
        {activeSection === 'my-profile' && (
          <div className="space-y-8">
            {isEditingProfile ? (
              <OnboardingForm
                mode="edit"
                activeUserId={profile.userId}
                initialProfile={profile}
                isSaving={isSaving}
                onSaveProfile={async (updatedProfile) => {
                  await onSaveProfileEdits(updatedProfile);
                  onSetEditingProfile(false);
                  triggerBanner(
                    'Your profile changes have been saved. Existing semester roadmaps are safely preserved. If your new profile requires updated recommendations, select "Revise My Roadmap" in My Roadmap.'
                  );
                }}
                onCancel={() => onSetEditingProfile(false)}
              />
            ) : (
              <>
                {/* Saved Student Profile Details Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-blue-700">
                        01. My Profile · Persistent Student Record
                      </p>
                      <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                        Saved Academic & Career Details
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSetEditingProfile(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-xl hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <dt className="text-xs text-slate-500">Full Name</dt>
                      <dd className="font-bold text-slate-900 mt-1">{profile.fullName}</dd>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <dt className="text-xs text-slate-500">BTech Branch</dt>
                      <dd className="font-bold text-slate-900 mt-1">{displayBranch}</dd>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <dt className="text-xs text-slate-500">Current Year & Semester</dt>
                      <dd className="font-bold text-slate-900 mt-1">
                        {profile.currentYear} · {profile.currentSemester}
                      </dd>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <dt className="text-xs text-slate-500">Available Study Hours</dt>
                      <dd className="font-bold font-mono tabular-nums text-slate-900 mt-1">
                        {profile.weeklyStudyHours} hours / week
                      </dd>
                    </div>
                  </dl>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <p className="text-xs font-semibold text-slate-500 mb-2">
                        Current Academic Subjects ({profile.currentSubjects.length})
                      </p>
                      <ul className="space-y-1.5 text-xs sm:text-sm font-medium text-slate-900">
                        {profile.currentSubjects.map((sub, i) => (
                          <li key={sub} className="flex items-baseline gap-2">
                            <span className="font-mono text-xs text-blue-700">0{i + 1}.</span>
                            <span>{sub}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <p className="text-xs font-semibold text-slate-500 mb-2">
                        Existing Skills ({profile.knownSkills.length})
                      </p>
                      {profile.knownSkills.length > 0 ? (
                        <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
                          {profile.knownSkills.join(' · ')}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          No prior skills entered — starting from beginner baseline.
                        </p>
                      )}
                    </div>

                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Career Goal</p>
                        <p className="text-sm font-bold text-blue-700 mt-0.5">
                          {profile.careerGoal}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-200/80">
                        <p className="text-xs font-semibold text-slate-500">
                          Preferred Learning Method
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-slate-900 mt-0.5">
                          {profile.preferredLearningMethod}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Semester History & Cumulative Achievements Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-blue-700">
                        Semester-Wise History & Cumulative Portfolio
                      </p>
                      <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                        Your Semesters & Completed Milestones
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Click any semester card below to inspect its saved roadmap, skills, projects, and opportunities.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenStartNewSemesterModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Start a New Semester</span>
                    </button>
                  </div>

                  {/* Cumulative Stats Across All Semesters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500">Saved Semesters</p>
                      <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                        {sortedSemesters.length}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500">Completed Semesters</p>
                      <p className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                        {completedSemestersList.length}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500">Mastered Skills</p>
                      <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                        {allMasteredSkills.length}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500">Completed Tasks</p>
                      <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                        {allCompletedTasksCount}
                      </p>
                    </div>
                  </div>

                  {/* Semester Cards List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedSemesters.map((sem) => {
                      const isCurrentlyViewed = sem.semesterId === currentRecord?.semesterId;
                      return (
                        <div
                          key={sem.semesterId}
                          className={`p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
                            isCurrentlyViewed
                              ? 'bg-blue-50/40 border-blue-600'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900">
                                {sem.semesterName} · {sem.academicYear}
                              </span>
                              <span
                                className={`font-mono font-semibold ${
                                  sem.status === 'completed'
                                    ? 'text-emerald-700'
                                    : 'text-blue-700'
                                }`}
                              >
                                {sem.status.toUpperCase()} · {sem.progressPercent}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              Subjects: {sem.subjects.join(', ')}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                            <span className="text-xs font-mono tabular-nums text-slate-500">
                              {sem.weeklyPlans.filter((w) => w.isCompleted).length}/
                              {sem.weeklyPlans.length} weeks ·{' '}
                              {sem.skills.filter((sk) => sk.status === 'mastered').length} skills mastered
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setViewedSemesterId(sem.semesterId);
                                onSelectSection('my-roadmap');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {isCurrentlyViewed ? 'Open Roadmap →' : 'Switch & View →'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Completed Skills & Projects Archive Across Semesters */}
                  {(allMasteredSkills.length > 0 || allCompletedProjects.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-700 mb-2">
                          Cumulative Mastered Skills Across All Semesters ({allMasteredSkills.length})
                        </p>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          {allMasteredSkills.join(' · ')}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-700 mb-2">
                          Completed Engineering Projects ({allCompletedProjects.length})
                        </p>
                        {allCompletedProjects.length > 0 ? (
                          <ul className="space-y-1 text-xs text-slate-800">
                            {allCompletedProjects.map((p) => (
                              <li key={p.id}>
                                <strong>{p.title}</strong> ({p.semesterName})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500">
                            Complete all 3 milestones on any project in My Projects to archive it here.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Storage & Account Separation Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-blue-700">
                        Storage Security & Account Separation
                      </p>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                        {isCloudAuthenticated
                          ? 'Cloud Firestore Persistence (Authenticated)'
                          : 'Local Browser Storage Mode (Device-Only)'}
                      </h2>
                    </div>

                    {isCloudAuthenticated ? (
                      <button
                        type="button"
                        onClick={onSignOut}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Sign Out of Google Cloud
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onSignInGoogle}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Sign in with Google for Cloud Sync</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {isCloudAuthenticated ? (
                      <>
                        Your profile and semester records are stored in <strong>Cloud Firestore</strong> under your verified account UID (<code className="font-mono text-xs">{profile.userId}</code>). Firestore Security Rules enforce that only your authenticated account can read or modify your records.
                      </>
                    ) : (
                      <>
                        <strong>Honest Storage Notice:</strong> You are currently using <strong>Local Browser Storage Mode</strong> under unique local account ID <code className="font-mono text-xs">{profile.userId}</code>. Browser storage keeps your data safe across page refreshes on this browser, but it is <strong>not cloud storage</strong> and will not sync across other devices unless you sign in with Google above.
                      </>
                    )}
                  </p>

                  {/* Local Account Switcher for testing multi-student account isolation */}
                  {!isCloudAuthenticated && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                          <Users className="w-4 h-4 text-blue-700" />
                          <span>Local Student Accounts on This Browser ({localAccounts.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={onCreateNewLocalAccount}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          + Create Separate Student Account
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Each student account has its own unique <code className="font-mono">userId</code> and isolated profile, roadmaps, and semester history:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {localAccounts.map((acc) => {
                          const isCurrent = acc.userId === profile.userId;
                          return (
                            <button
                              key={acc.userId}
                              type="button"
                              onClick={() => onSwitchLocalAccount(acc.userId)}
                              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {acc.fullName} ({acc.branch} · {acc.currentSemester})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================================================================
            SECTION 2: MY ROADMAP (`my-roadmap`)
            Displays the saved Roadmap Overview, Three-Month Plan, Subject-to-
            Real-World Bridges, Monthly Learning Plans, and Weekly Learning Plans.
            =================================================================== */}
        {activeSection === 'my-roadmap' && (!currentRecord ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-3">
            <Compass className="w-8 h-8 text-blue-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Roadmap Record Available</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Complete onboarding or start a semester to generate your personalized learning roadmap.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section Header + Explicit Revise Roadmap Button */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-700">
                  02. My Roadmap · {currentRecord.semesterName} ({currentRecord.academicYear})
                </p>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Saved Semester Roadmap & Practical Engineering Bridges
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tailored to your BTech branch, current subjects, study hours, and career goal. Refreshing preserves your exact roadmap.
                </p>
              </div>

              {!isViewingCompletedSemester && (
                <button
                  type="button"
                  onClick={() => setShowRegenerateModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Revise My Roadmap</span>
                </button>
              )}
            </div>

            {/* 1. Roadmap Overview & Career Progression Pathway */}
            <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-lg">
                      {currentRecord.roadmapOverview?.currentLevel || `${currentRecord.academicYear} · ${currentRecord.semesterName}`}
                    </span>
                    <span className="text-xs text-slate-300">Target Career Goal:</span>
                    <span className="text-xs font-bold text-amber-300">{currentRecord.careerGoal}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                    Engineering Roadmap: Classroom to {currentRecord.careerGoal}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200">
                    <span className="text-slate-400">Budget: </span>
                    <strong className="text-white font-mono">{currentRecord.weeklyStudyHours} hrs/wk</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200">
                    <span className="text-slate-400">Method: </span>
                    <strong className="text-white truncate max-w-[170px] inline-block align-bottom">{currentRecord.preferredLearningMethod}</strong>
                  </div>
                </div>
              </div>

              {/* 4-Stage Learning Sequence */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-300 mb-3">
                  Suggested Learning Sequence for {currentRecord.semesterName}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {currentRecord.roadmapOverview?.learningSequence?.map((seq, sIdx) => (
                    <div key={sIdx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <span className="font-mono text-[11px] text-blue-400 font-bold">STAGE 0{sIdx + 1}</span>
                      <p className="text-slate-200 font-medium leading-relaxed">{seq.replace(/^[0-9]\.\s*/, '')}</p>
                    </div>
                  )) || (
                    <>
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                        <span className="font-mono text-[11px] text-blue-400 font-bold">STAGE 01</span>
                        <p className="text-slate-200 font-medium">Grounding: Map semester subjects to industry tooling</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                        <span className="font-mono text-[11px] text-blue-400 font-bold">STAGE 02</span>
                        <p className="text-slate-200 font-medium">Skill Sprints: Complete hands-on lab exercises ({currentRecord.weeklyStudyHours} hrs/wk)</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                        <span className="font-mono text-[11px] text-blue-400 font-bold">STAGE 03</span>
                        <p className="text-slate-200 font-medium">System Build: Implement Capstone Engineering Project</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                        <span className="font-mono text-[11px] text-blue-400 font-bold">STAGE 04</span>
                        <p className="text-slate-200 font-medium">Placement Prep: Mock technical drills & internship pipeline</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Career Readiness Insight */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-400/20 text-xs text-slate-200 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Career Readiness Context: </strong>
                  {currentRecord.roadmapOverview?.careerReadinessNote ||
                    `Specifically customized for a ${profile.branch} student targeting ${profile.careerGoal}. Balances your ${profile.preferredLearningMethod} learning style with university exams so you build career depth without burning out.`}
                </p>
              </div>
            </div>

            {/* 2. Three-Month Plan (90-Day Milestone) */}
            {currentRecord.threeMonthMilestone && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-700" />
                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        Three-Month Semester Goal · 90-Day Key Deliverable
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {currentRecord.threeMonthMilestone.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    disabled={isViewingCompletedSemester}
                    onClick={handleToggleThreeMonthMilestone}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      currentRecord.threeMonthMilestone.isCompleted
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                    } disabled:opacity-50`}
                  >
                    {currentRecord.threeMonthMilestone.isCompleted ? '✓ Milestone Completed' : 'Mark Milestone Complete'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-700">Target Core Competencies:</span>
                    <p className="text-slate-800 font-medium">
                      {currentRecord.threeMonthMilestone.targetSkills.join(' · ')}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-700">Practical Verifiable Outcome:</span>
                    <p className="text-slate-800 font-medium">
                      {currentRecord.threeMonthMilestone.outcome}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Subject-to-Real-World Applications */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Subject-to-Real-World Engineering Bridges ({currentRecord.subjectBridges.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  How each of your {currentRecord.semesterName} subjects powers real industrial systems for a {currentRecord.careerGoal}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {currentRecord.subjectBridges.map((bridge, idx) => (
                  <div
                    key={bridge.id}
                    className={`p-5 rounded-xl border flex flex-col justify-between gap-4 ${
                      bridge.isExplored
                        ? 'bg-blue-50/40 border-blue-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono font-semibold text-blue-700">
                          SUBJECT 0{idx + 1}
                        </span>
                        <span className="text-slate-500 font-medium">{bridge.studyResourceFormat}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">
                        {bridge.subjectName}
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            Classroom Concepts in College:
                          </span>
                          <p className="text-slate-600 pl-5">{bridge.classroomConcepts}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                            Where It Is Used in Industry:
                          </span>
                          <p className="text-slate-800 font-medium pl-5">{bridge.realWorldApplication}</p>
                        </div>

                        {bridge.practicalSkillOrTool && (
                          <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1">
                            <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              Practical Tool / Skill to Learn:
                            </span>
                            <p className="text-slate-800 font-medium pl-5">{bridge.practicalSkillOrTool}</p>
                          </div>
                        )}

                        {bridge.practicalExercise && (
                          <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1">
                            <span className="font-semibold text-indigo-800 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                              Hands-on Exercise / Mini-Project:
                            </span>
                            <p className="text-slate-700 pl-5">{bridge.practicalExercise}</p>
                          </div>
                        )}

                        <div>
                          <span className="font-semibold text-blue-800">Career Skill Unlocked: </span>
                          <span className="text-blue-900 font-medium">
                            {bridge.industrySkillUnlocked}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {bridge.isExplored ? 'Bridge concept reviewed' : 'Pending concept review'}
                      </span>
                      <button
                        type="button"
                        disabled={isViewingCompletedSemester}
                        onClick={() => handleToggleSubjectBridgeExplored(bridge.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          bridge.isExplored
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        } disabled:opacity-50`}
                      >
                        {bridge.isExplored ? '✓ Explored' : 'Mark Explored'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Part B: Monthly Learning Plan (4 Months) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Monthly Learning Plan (4-Month Semester Phases)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-level monthly milestones balancing college exams with career preparation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRecord.monthlyPlans.map((month) => (
                  <div
                    key={month.id}
                    className={`p-5 rounded-xl border flex flex-col justify-between gap-4 ${
                      month.isCompleted
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-blue-700">
                          MONTH 0{month.monthNumber}
                        </span>
                        <span className="text-slate-500">
                          {month.isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{month.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {month.focusSummary}
                      </p>
                      <p className="text-xs text-slate-800">
                        <strong>Outcome:</strong> {month.targetOutcome}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex justify-end">
                      <button
                        type="button"
                        disabled={isViewingCompletedSemester}
                        onClick={() => handleToggleMonthlyMilestone(month.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          month.isCompleted
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        } disabled:opacity-50`}
                      >
                        {month.isCompleted ? '✓ Month Completed' : 'Mark Month Complete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Part C: Weekly Learning Plan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Weekly Learning Plan ({currentRecord.weeklyStudyHours} hrs/week budget)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Check off weekly deliverables as you complete them. Progress is saved automatically.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums font-semibold text-blue-700">
                  {currentRecord.weeklyPlans.filter((w) => w.isCompleted).length} /{' '}
                  {currentRecord.weeklyPlans.length} Weeks Completed
                </span>
              </div>

              <div className="space-y-3">
                {currentRecord.weeklyPlans.map((week) => (
                  <div
                    key={week.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      week.isCompleted
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-bold text-slate-900">
                          Week 0{week.weekNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Subject: {week.subjectLinked}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {week.allocatedHours} hrs allocated
                        </span>
                        {week.wasRearranged && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-800 font-semibold">
                              Timetable Adjusted
                            </span>
                          </>
                        )}
                      </div>
                      <p
                        className={`text-sm font-bold ${
                          week.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {week.title}
                      </p>
                      <p className="text-xs text-slate-600">{week.deliverableTask}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isViewingCompletedSemester}
                        onClick={() => handleToggleWeeklyTask(week.id)}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                          week.isCompleted
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                        } disabled:opacity-50`}
                      >
                        {week.isCompleted ? '✓ Completed' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Part D: Skills Roadmap & Verified Learning Resources */}
            {(() => {
              const knownSkillsCount = currentRecord.skills.filter((s) => s.category === 'Baseline Known').length;
              const recommendedSkillsCount = currentRecord.skills.filter((s) => s.category !== 'Baseline Known').length;
              const inProgressSkillsCount = currentRecord.skills.filter((s) => s.status === 'in-progress').length;
              const masteredSkillsCount = currentRecord.skills.filter((s) => s.status === 'mastered').length;

              const filteredSkills = currentRecord.skills.filter((s) => {
                if (skillFilter === 'known') return s.category === 'Baseline Known';
                if (skillFilter === 'recommended') return s.category !== 'Baseline Known';
                if (skillFilter === 'in-progress') return s.status === 'in-progress';
                if (skillFilter === 'mastered') return s.status === 'mastered';
                return true;
              });

              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-blue-700" />
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                          Target Skills Roadmap & Verified Resources
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">
                        Technical Skills to Learn for {currentRecord.semesterName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Categorized by baseline foundation, subject-linked core, and career target skills. Click official docs to study, or update your proficiency status as you learn.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shrink-0">
                      <span className="font-bold text-emerald-700">{masteredSkillsCount}</span> /{' '}
                      <span>{currentRecord.skills.length} Mastered</span>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        { id: 'all', label: `All Skills (${currentRecord.skills.length})` },
                        { id: 'known', label: `Known Foundation (${knownSkillsCount})` },
                        { id: 'recommended', label: `Recommended by Roadmap (${recommendedSkillsCount})` },
                        { id: 'in-progress', label: `In Progress (${inProgressSkillsCount})` },
                        { id: 'mastered', label: `Mastered (${masteredSkillsCount})` },
                      ] as const
                    ).map((tab) => {
                      const isSelected = skillFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSkillFilter(tab.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Skills Cards Grid */}
                  <div className="space-y-4">
                    {filteredSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-5"
                      >
                        <div className="space-y-2.5 max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                skill.category === 'Baseline Known'
                                  ? 'bg-slate-200 text-slate-800'
                                  : skill.category === 'Subject-Linked Core'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {skill.category}
                            </span>

                            {skill.level && (
                              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-white border border-slate-300 text-slate-700">
                                {skill.level}
                              </span>
                            )}

                            <span className="text-slate-500">· Linked: {skill.linkedSubject}</span>
                            <span className="text-slate-500">· ~{skill.estimatedHours} hrs</span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900">
                            {skill.skillName}
                          </h3>

                          {/* Learning Resource with Legitimate Link */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                            <BookOpen className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>Resource: <strong>{skill.resourceTitle}</strong></span>
                            {skill.resourceLink && (
                              <a
                                href={skill.resourceLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline"
                              >
                                <span>Official Docs</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {/* Practical Practice Task */}
                          {skill.practiceTask && (
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs space-y-0.5">
                              <span className="font-semibold text-slate-700">Practice Task: </span>
                              <span className="text-slate-600">{skill.practiceTask}</span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Status Segmented Control */}
                        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shrink-0 self-start md:self-center">
                          {(['planned', 'in-progress', 'mastered'] as const).map((statusOption) => {
                            const active = skill.status === statusOption;
                            return (
                              <button
                                key={statusOption}
                                type="button"
                                disabled={isViewingCompletedSemester}
                                onClick={() => handleChangeSkillStatus(skill.id, statusOption)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer capitalize whitespace-nowrap ${
                                  active
                                    ? statusOption === 'mastered'
                                      ? 'bg-emerald-700 text-white'
                                      : 'bg-blue-700 text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                } disabled:opacity-50`}
                              >
                                {statusOption.replace('-', ' ')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {filteredSkills.length === 0 && (
                      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                        No skills match the selected filter. Try switching to "All Skills".
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Part E: Suitable Semester Projects Preview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Suitable Semester Projects
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Projects Progressive with Your Roadmap
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reinforce classroom theory with real industry-standard software and hardware deliverables.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectSection('my-projects')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                >
                  <span>Open Full Projects Workspace</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRecord.projects.map((proj, pIdx) => (
                  <div key={proj.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-blue-700 font-semibold">PROJECT 0{pIdx + 1}</span>
                        {proj.difficulty && (
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            {proj.difficulty}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{proj.problemStatement}</p>
                      <div className="flex flex-wrap gap-1 text-[11px] pt-1">
                        <span className="text-slate-500">Required Skills:</span>
                        <span className="font-medium text-slate-800">{proj.targetSkill}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Milestones: {proj.milestones.filter((m) => m.completed).length}/{proj.milestones.length}
                      </span>
                      <span className="font-bold font-mono text-blue-700">{proj.progressPercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* ===================================================================
            SECTION 3: MY PROJECTS (`my-projects`)
            Displays saved semester projects and their interactive milestones.
            =================================================================== */}
        {activeSection === 'my-projects' && (!currentRecord ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-3">
            <FolderGit2 className="w-8 h-8 text-blue-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Projects Record Available</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Complete onboarding or start a semester to generate projects tailored to your syllabus.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-5">
                <p className="text-xs font-semibold text-blue-700">
                  03. My Projects · {currentRecord.semesterName}
                </p>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Subject-Integrated Engineering Projects
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Check off milestones below as you build each project. Your progress percentage is automatically calculated and saved.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {currentRecord.projects.map((project, idx) => (
                  <div
                    key={project.id}
                    className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-blue-700">
                            PROJECT 0{idx + 1}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Subjects: {project.linkedSubjects.join(', ')}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            ~{project.estimatedHours} hrs total
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            {project.title}
                          </h3>
                          {project.difficulty && (
                            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              {project.difficulty}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-bold font-mono tabular-nums text-blue-700">
                          {project.progressPercent}%
                        </span>
                        <p className="text-xs text-slate-500 capitalize">
                          {project.status.replace('-', ' ')}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <strong>Problem Statement: </strong>
                      {project.problemStatement}
                    </p>

                    <div className="text-xs text-slate-600">
                      <strong>Real-World Context:</strong> {project.realWorldContext} ·{' '}
                      <strong>Target Competency:</strong> {project.targetSkill}
                    </div>

                    {project.expectedOutcome && (
                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-0.5">
                        <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          Expected Outcome & Portfolio Deliverable:
                        </span>
                        <p className="text-slate-700 pl-5">{project.expectedOutcome}</p>
                      </div>
                    )}

                    {project.suggestedTools && project.suggestedTools.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-slate-500 font-semibold mr-1">Suggested Tools:</span>
                        {project.suggestedTools.map((tool, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800 text-[11px] font-mono"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-700 transition-all"
                        style={{ width: `${project.progressPercent}%` }}
                      />
                    </div>

                    {/* Project Milestones Checklist */}
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold text-slate-700">
                        Engineering Milestones (Click to toggle completion):
                      </p>
                      {project.milestones.map((milestone, mIdx) => (
                        <button
                          key={milestone.id}
                          type="button"
                          disabled={isViewingCompletedSemester}
                          onClick={() =>
                            handleToggleProjectMilestone(project.id, milestone.id)
                          }
                          className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            milestone.completed
                              ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                          } disabled:opacity-50`}
                        >
                          <span className="text-xs sm:text-sm font-medium">
                            <span className="font-mono text-xs text-slate-500 mr-2">
                              M0{mIdx + 1}.
                            </span>
                            <span className={milestone.completed ? 'line-through text-slate-500' : ''}>
                              {milestone.label}
                            </span>
                          </span>
                          <span
                            className={`text-xs font-semibold shrink-0 ${
                              milestone.completed ? 'text-emerald-700' : 'text-blue-700'
                            }`}
                          >
                            {milestone.completed ? '✓ Done' : 'Mark Done'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {currentRecord.projects.length === 0 && (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                    No engineering projects recorded for this semester yet. Click "Revise My Roadmap" in My Roadmap to generate curated projects.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* ===================================================================
            SECTION 4: MY OPPORTUNITIES (`my-opportunities`)
            Displays saved Internships, Hackathons, and Placement Prep Tasks.
            =================================================================== */}
        {activeSection === 'my-opportunities' && (!currentRecord ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-3">
            <Briefcase className="w-8 h-8 text-blue-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Opportunities Available</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Complete onboarding or start a semester to explore opportunities matched to your profile.
            </p>
          </div>
        ) : (() => {
          const internshipCount = currentRecord.opportunities.filter((o) => o.type === 'Internship').length;
          const hackathonCount = currentRecord.opportunities.filter((o) => o.type === 'Hackathon').length;
          const researchCount = currentRecord.opportunities.filter((o) => o.type === 'Research / Open-Source').length;

          const filteredOpps = currentRecord.opportunities.filter((opp) => {
            if (oppFilter === 'all') return true;
            return opp.type === oppFilter;
          });

          return (
            <div className="space-y-8">
              {/* Internships & Hackathons */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="border-b border-slate-100 pb-5">
                  <p className="text-xs font-semibold text-blue-700">
                    04. My Opportunities · {currentRecord.semesterName} ({currentRecord.academicYear})
                  </p>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    Internships, Hackathons & Technical Fellowships
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Track your application pipeline for {currentRecord.academicYear} opportunities matched to your {profile.branch} branch and career goal.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { id: 'all', label: `All Opportunities (${currentRecord.opportunities.length})` },
                      { id: 'Internship', label: `Internships (${internshipCount})` },
                      { id: 'Hackathon', label: `Hackathons (${hackathonCount})` },
                      { id: 'Research / Open-Source', label: `Research / Open-Source (${researchCount})` },
                    ] as const
                  ).map((tab) => {
                    const isSelected = oppFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setOppFilter(tab.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  {filteredOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-blue-700 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md">
                            {opp.type}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{opp.eligibilityYear}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700">{opp.timelineWindow}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{opp.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {opp.whyRelevant}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-slate-500 font-semibold">Key Skills:</span>
                          {opp.requiredSkills.map((sk, sIdx) => (
                            <span key={sIdx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium text-[11px]">
                              {sk}
                            </span>
                          ))}
                          {opp.sourceLink && (
                            <a
                              href={opp.sourceLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline ml-2"
                            >
                              <span>Official Portal</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shrink-0 self-start lg:self-center">
                        {(['suggested', 'saved', 'applied', 'completed'] as const).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              disabled={isViewingCompletedSemester}
                              onClick={() => handleChangeOpportunityStatus(opp.id, st)}
                              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer capitalize whitespace-nowrap ${
                                opp.status === st
                                  ? 'bg-blue-700 text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              } disabled:opacity-50`}
                            >
                              {st}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredOpps.length === 0 && (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                      No opportunities found under this filter. Try selecting "All Opportunities".
                    </div>
                  )}
                </div>
              </div>

            {/* Placement Preparation Tasks */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Semester Placement Preparation Checklist
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stage-gated placement tasks for {currentRecord.semesterName} so you build interview depth early.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums font-semibold text-blue-700">
                  {currentRecord.placementTasks.filter((t) => t.completed).length} /{' '}
                  {currentRecord.placementTasks.length} Completed
                </span>
              </div>

              <div className="space-y-3">
                {currentRecord.placementTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      task.completed
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-blue-700">
                        {task.category}
                      </span>
                      <p
                        className={`text-sm font-bold ${
                          task.completed ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-600">{task.description}</p>
                    </div>

                    <button
                      type="button"
                      disabled={isViewingCompletedSemester}
                      onClick={() => handleTogglePlacementTask(task.id)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        task.completed
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                      } disabled:opacity-50`}
                    >
                      {task.completed ? '✓ Completed' : 'Mark Complete'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })())}

        {/* ===================================================================
            SECTION 5: MY PROGRESS (`my-progress`)
            Displays semester completion metrics and Adaptive Timetable Rearranger.
            =================================================================== */}
        {activeSection === 'my-progress' && (!currentRecord ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-3">
            <CalendarClock className="w-8 h-8 text-blue-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Progress Record Available</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Complete onboarding or start a semester to view completion metrics and timetables.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-semibold text-blue-700">
                    05. My Progress · {currentRecord.semesterName}
                  </p>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    Semester Completion & Adaptive Timetable
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold font-mono tabular-nums text-blue-700">
                    {currentRecord.progressPercent}%
                  </span>
                  <p className="text-xs text-slate-500">Overall Semester Progress</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-700 transition-all duration-500"
                  style={{ width: `${currentRecord.progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Roadmap Weeks Done</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {currentRecord.weeklyPlans.filter((w) => w.isCompleted).length} /{' '}
                    {currentRecord.weeklyPlans.length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Skills Mastered</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {currentRecord.skills.filter((s) => s.status === 'mastered').length} /{' '}
                    {currentRecord.skills.length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Projects Completed</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {currentRecord.projects.filter((p) => p.status === 'completed').length} /{' '}
                    {currentRecord.projects.length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Placement Tasks Done</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {currentRecord.placementTasks.filter((t) => t.completed).length} /{' '}
                    {currentRecord.placementTasks.length}
                  </p>
                </div>
              </div>

              {/* Three-Month Milestone Tracker & Weekly Study Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRecord.threeMonthMilestone && (
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        Three-Month Target Milestone
                      </span>
                      <span
                        className={`font-semibold ${
                          currentRecord.threeMonthMilestone.isCompleted
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {currentRecord.threeMonthMilestone.isCompleted ? '✓ Completed' : 'In Progress'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {currentRecord.threeMonthMilestone.title}
                    </h4>
                    <p className="text-xs text-slate-600">
                      Outcome: {currentRecord.threeMonthMilestone.outcome}
                    </p>
                  </div>
                )}

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" />
                      Weekly Study Hours Budget
                    </span>
                    <span className="font-mono font-semibold text-slate-700">
                      {currentRecord.weeklyStudyHours} hrs/week
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Calibrated for {currentRecord.preferredLearningMethod}
                  </h4>
                  <p className="text-xs text-slate-600">
                    Calculated to build depth in {currentRecord.careerGoal} alongside university exams without burnout.
                  </p>
                </div>
              </div>

              {/* Adaptive Timetable Rearranger */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Missed a Study Week? Adaptive Timetable Rearranger
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    When university mid-sems, lab exams, or illness cause you to miss a planned week, click a pending week below to redistribute its study hours smoothly across upcoming weeks.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentRecord.weeklyPlans
                    .filter((w) => !w.isCompleted)
                    .map((week) => (
                      <button
                        key={week.id}
                        type="button"
                        disabled={isViewingCompletedSemester}
                        onClick={() => handleRearrangeMissedWeek(week.weekNumber)}
                        className="px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Rearrange Missed Week 0{week.weekNumber} ({week.subjectLinked})
                      </button>
                    ))}

                  {currentRecord.weeklyPlans.filter((w) => !w.isCompleted).length === 0 && (
                    <p className="text-xs text-slate-500 italic">
                      All study weeks are completed! No timetable redistribution needed.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Bottom Back to Dashboard Action */}
        <div className="pt-4 pb-8 flex items-center justify-between border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              onSetEditingProfile(false);
              onSelectSection(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-700 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          MODAL 1: CONFIRM MARKING SEMESTER COMPLETE
          ===================================================================== */}
      {showCompleteSemesterModal && currentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-900">
              Mark {currentRecord.semesterName} Complete?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This will mark <strong>{currentRecord.semesterName}</strong> as completed (at{' '}
              <strong>{currentRecord.progressPercent}%</strong> progress) and preserve its roadmap,
              completed tasks, projects, and mastered skills in your permanent profile history.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCompleteSemesterModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkSemesterComplete}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 cursor-pointer"
              >
                Confirm & Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: CONFIRM REVISING ROADMAP
          ===================================================================== */}
      {showRegenerateModal && currentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-900">
              Revise {currentRecord.semesterName} Roadmap?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              PathPilot never overwrites a saved roadmap automatically. Confirming below will
              generate an updated roadmap for <strong>{currentRecord.semesterName}</strong> tailored to your
              latest profile settings and subjects while keeping all other semester records safe.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRegenerateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowRegenerateModal(false);
                  await onRegenerateSemesterRoadmap(
                    currentRecord.semesterName,
                    profile.currentSubjects
                  );
                  triggerBanner(
                    `Updated ${currentRecord.semesterName} roadmap recommendations with your latest profile settings.`
                  );
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-xl hover:bg-blue-800 cursor-pointer"
              >
                Confirm & Revise Roadmap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: START A NEW SEMESTER (Preserves all previous semesters)
          ===================================================================== */}
      {showStartSemesterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleConfirmStartNewSemester}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl"
          >
            <div>
              <p className="text-xs font-semibold text-blue-700">
                Semester Progression · Preserves All Past Records
              </p>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Start a New Semester
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                All roadmaps, completed tasks, projects, and skills from your previous semesters
                will remain saved and accessible in My Profile.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Select Semester to Start
              </label>
              <select
                value={newSemName}
                onChange={(e) => setNewSemName(e.target.value as AcademicSemester)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900"
              >
                {SEMESTER_OPTIONS.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem} ({getAcademicYearForSemester(sem)})
                    {semesterRecords[semesterNameToId(sem)] ? ' — Already Saved (Will Open/Update)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Subjects for {newSemName} (comma-separated)
              </label>
              <textarea
                rows={2}
                value={newSemSubjectsText}
                onChange={(e) => {
                  setNewSemSubjectsText(e.target.value);
                  setNewSemError('');
                }}
                placeholder="e.g., Computer Networks, Compiler Design, Artificial Intelligence"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900"
              />
              {newSemError && (
                <p className="text-xs font-medium text-red-600 mt-1">{newSemError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStartSemesterModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-xl hover:bg-blue-800 cursor-pointer"
              >
                Start {newSemName} & Save Roadmap
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
