/**
 * ============================================================================
 * FILE: src/components/OnboardingForm.tsx
 * PURPOSE: Collects and validates the student's academic and career details.
 *
 * KEY LOGIC FOR REQUIREMENT 1 & 2 (Form Reset vs. Profile Editing):
 * 1. Fresh Onboarding Mode (`mode === 'onboarding'`):
 *    Every time the user clicks "Build My Roadmap", `App.tsx` renders this
 *    component with `mode="onboarding"` and a unique `resetTriggerKey`.
 *    Because `initialProfile` is NOT loaded in `'onboarding'` mode, every input,
 *    dropdown, branch card, and validation error starts 100% empty—without
 *    deleting any already-saved student profile in storage!
 *    If the user clicks "Cancel" or navigates away without submitting, their
 *    previously saved profile and roadmaps remain completely untouched.
 *
 * 2. Profile Edit Mode (`mode === 'edit'`):
 *    When the user clicks "Edit Profile" inside the Dashboard's "My Profile"
 *    section, this form is rendered with `mode="edit"` and `initialProfile`
 *    populated with their saved data. Changes are held in temporary React state
 *    (`formInput`) and only written to persistent storage when the user
 *    explicitly clicks "Save Changes".
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowLeft, Check, Sparkles } from 'lucide-react';
import {
  AcademicSemester,
  AcademicYear,
  BRANCH_OPTIONS,
  BRANCH_SUGGESTIONS,
  EngineeringBranch,
  LEARNING_METHOD_OPTIONS,
  LearningMethod,
  SEMESTER_OPTIONS,
  StudentProfile,
  YEAR_OPTIONS,
} from '../types/student';
import {
  getExpectedSemestersForYear,
  parseCommaSeparatedList,
  RawOnboardingFormInput,
  validateOnboardingForm,
} from '../utils/validation';

const EMPTY_FORM_STATE: RawOnboardingFormInput = {
  fullName: '',
  branch: '',
  customBranchName: '',
  currentYear: '',
  currentSemester: '',
  subjectsText: '',
  careerGoal: '',
  knownSkillsText: '',
  weeklyStudyHours: '',
  preferredLearningMethod: '',
};

interface OnboardingFormProps {
  mode: 'onboarding' | 'edit';
  activeUserId: string;
  initialProfile: StudentProfile | null;
  hasExistingSavedData?: boolean;
  isSaving?: boolean;
  onSaveProfile: (profile: StudentProfile, replaceRoadmapConfirmed: boolean) => void;
  onCancel: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  mode,
  activeUserId,
  initialProfile,
  hasExistingSavedData = false,
  isSaving = false,
  onSaveProfile,
  onCancel,
}) => {
  /**
   * Initialize form state:
   * - If `mode === 'edit'` AND `initialProfile` is provided, load the saved profile.
   * - If `mode === 'onboarding'` ("Build My Roadmap"), ALWAYS start with empty fields!
   */
  const [formInput, setFormInput] = useState<RawOnboardingFormInput>(() => {
    if (mode === 'edit' && initialProfile) {
      return {
        fullName: initialProfile.fullName,
        branch: initialProfile.branch,
        customBranchName: initialProfile.customBranchName || '',
        currentYear: initialProfile.currentYear,
        currentSemester: initialProfile.currentSemester,
        subjectsText: initialProfile.currentSubjects.join(', '),
        careerGoal: initialProfile.careerGoal,
        knownSkillsText: initialProfile.knownSkills.join(', '),
        weeklyStudyHours: String(initialProfile.weeklyStudyHours),
        preferredLearningMethod: initialProfile.preferredLearningMethod,
      };
    }
    return { ...EMPTY_FORM_STATE };
  });

  const [hasSubmittedOnce, setHasSubmittedOnce] = useState<boolean>(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [confirmOverwriteModal, setConfirmOverwriteModal] = useState<StudentProfile | null>(null);

  /**
   * Whenever `mode` is `'onboarding'`, guarantee that all form fields and
   * validation messages are reset to empty on mount.
   */
  useEffect(() => {
    if (mode === 'onboarding') {
      setFormInput({ ...EMPTY_FORM_STATE });
      setHasSubmittedOnce(false);
      setTouchedFields({});
      setConfirmOverwriteModal(null);
    } else if (mode === 'edit' && initialProfile) {
      setFormInput({
        fullName: initialProfile.fullName,
        branch: initialProfile.branch,
        customBranchName: initialProfile.customBranchName || '',
        currentYear: initialProfile.currentYear,
        currentSemester: initialProfile.currentSemester,
        subjectsText: initialProfile.currentSubjects.join(', '),
        careerGoal: initialProfile.careerGoal,
        knownSkillsText: initialProfile.knownSkills.join(', '),
        weeklyStudyHours: String(initialProfile.weeklyStudyHours),
        preferredLearningMethod: initialProfile.preferredLearningMethod,
      });
      setHasSubmittedOnce(false);
      setTouchedFields({});
    }
  }, [mode, initialProfile]);

  const { errors, isValid } = validateOnboardingForm(formInput);

  const updateField = <K extends keyof RawOnboardingFormInput>(
    field: K,
    value: RawOnboardingFormInput[K]
  ) => {
    setFormInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const markFieldTouched = (fieldName: string) => {
    setTouchedFields((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  };

  const shouldShowError = (fieldName: keyof typeof errors): boolean => {
    return Boolean(errors[fieldName] && (hasSubmittedOnce || touchedFields[fieldName]));
  };

  const handleYearChange = (newYear: AcademicYear) => {
    const matchingSemesters = getExpectedSemestersForYear(newYear);
    const currentSemStillValid =
      formInput.currentSemester && matchingSemesters.includes(formInput.currentSemester);

    setFormInput((prev) => ({
      ...prev,
      currentYear: newYear,
      currentSemester: currentSemStillValid
        ? prev.currentSemester
        : matchingSemesters[0] || prev.currentSemester,
    }));
    markFieldTouched('currentYear');
  };

  const handleToggleSubjectSuggestion = (subjectName: string) => {
    const currentList = parseCommaSeparatedList(formInput.subjectsText);
    const exists = currentList.some(
      (item) => item.toLowerCase() === subjectName.toLowerCase()
    );

    const updatedList = exists
      ? currentList.filter((item) => item.toLowerCase() !== subjectName.toLowerCase())
      : [...currentList, subjectName];

    updateField('subjectsText', updatedList.join(', '));
    markFieldTouched('currentSubjects');
  };

  /**
   * Reset only the form inputs (without touching saved student data in storage).
   */
  const handleClearFormInputsOnly = () => {
    setFormInput({ ...EMPTY_FORM_STATE });
    setHasSubmittedOnce(false);
    setTouchedFields({});
  };

  const handleFillSampleStudent = () => {
    setFormInput({
      fullName: 'Aarav Sharma',
      branch: 'CSE',
      customBranchName: '',
      currentYear: '2nd Year',
      currentSemester: 'Semester 4',
      subjectsText:
        'Operating Systems, Database Management Systems, Design & Analysis of Algorithms, Computer Organization',
      careerGoal: 'Backend & Distributed Systems Engineer',
      knownSkillsText: 'C++, Basic SQL, Git, Linux CLI',
      weeklyStudyHours: '12',
      preferredLearningMethod: 'Hands-on Project Building',
    });
    setHasSubmittedOnce(false);
    setTouchedFields({});
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmittedOnce(true);

    if (
      !isValid ||
      !formInput.branch ||
      !formInput.currentYear ||
      !formInput.currentSemester ||
      !formInput.preferredLearningMethod
    ) {
      return;
    }

    const nowIso = new Date().toISOString();
    const cleanedProfile: StudentProfile = {
      userId: initialProfile?.userId || activeUserId,
      fullName: formInput.fullName.trim(),
      branch: formInput.branch,
      customBranchName:
        formInput.branch === 'Other' ? formInput.customBranchName.trim() : '',
      currentYear: formInput.currentYear,
      currentSemester: formInput.currentSemester,
      currentSubjects: parseCommaSeparatedList(formInput.subjectsText),
      careerGoal: formInput.careerGoal.trim(),
      knownSkills: parseCommaSeparatedList(formInput.knownSkillsText),
      weeklyStudyHours: Number(formInput.weeklyStudyHours.trim()),
      preferredLearningMethod: formInput.preferredLearningMethod,
      createdAt: initialProfile?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    // If starting a new onboarding when a saved profile already exists,
    // ask for explicit confirmation before replacing existing saved profile/roadmap data.
    if (mode === 'onboarding' && hasExistingSavedData) {
      setConfirmOverwriteModal(cleanedProfile);
      return;
    }

    onSaveProfile(cleanedProfile, false);
  };

  const activeBranchSuggestions = formInput.branch
    ? BRANCH_SUGGESTIONS[formInput.branch]
    : null;
  const parsedCurrentSubjects = parseCommaSeparatedList(formInput.subjectsText);
  const expectedSemesters = getExpectedSemestersForYear(formInput.currentYear);

  return (
    <div className={mode === 'onboarding' ? 'min-h-screen bg-slate-50 py-10 px-4 sm:px-6' : ''}>
      <div className={mode === 'onboarding' ? 'max-w-3xl mx-auto' : ''}>
        {/* Top Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {mode === 'edit'
                ? 'Cancel Edit & Return to My Profile'
                : hasExistingSavedData
                ? 'Cancel (Keep Existing Saved Data)'
                : 'Back to Landing Page'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearFormInputsOnly}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Clear Form Fields
            </button>
            <button
              type="button"
              onClick={handleFillSampleStudent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Sample Student Data</span>
            </button>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10">
          <div className="border-b border-slate-200 pb-6 mb-8">
            <p className="text-xs font-semibold text-blue-700">
              {mode === 'edit'
                ? 'My Profile · Edit Saved Information'
                : 'Fresh Onboarding · All Fields Reset'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              {mode === 'edit'
                ? 'Edit Your Student Profile'
                : 'Configure Your BTech Roadmap'}
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              {mode === 'edit'
                ? 'Update your academic details below. Your saved profile will only be updated when you click "Save Changes".'
                : 'Enter your BTech branch, current semester, subjects, and career goal to generate your personalized roadmap. Fields marked with * are required.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* 1. Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-semibold text-slate-900 mb-1.5"
              >
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={formInput.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                onBlur={() => markFieldTouched('fullName')}
                placeholder="e.g., Aarav Sharma"
                className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  shouldShowError('fullName')
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                }`}
              />
              {shouldShowError('fullName') && (
                <p
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            {/* 2. BTech Branch */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                BTech Branch <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Select your department so we can suggest relevant college subjects and real-world
                engineering applications.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BRANCH_OPTIONS.map((option) => {
                  const isSelected = formInput.branch === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        updateField('branch', option.value);
                        markFieldTouched('branch');
                      }}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-600 text-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{option.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{option.coreFocus}</p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {shouldShowError('branch') && (
                <p
                  role="alert"
                  className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.branch}</span>
                </p>
              )}

              {formInput.branch === 'Other' && (
                <div className="mt-4">
                  <label
                    htmlFor="customBranchName"
                    className="block text-xs font-semibold text-slate-800 mb-1"
                  >
                    Specify Your Engineering Branch <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="customBranchName"
                    type="text"
                    value={formInput.customBranchName}
                    onChange={(e) => updateField('customBranchName', e.target.value)}
                    onBlur={() => markFieldTouched('customBranchName')}
                    placeholder="e.g., Chemical Engineering, Aerospace, Biotechnology"
                    className={`w-full px-4 py-2 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                      shouldShowError('customBranchName')
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  {shouldShowError('customBranchName') && (
                    <p
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.customBranchName}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 3 & 4. Current Year and Current Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Current Year <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {YEAR_OPTIONS.map((yearOption) => {
                    const isSelected = formInput.currentYear === yearOption;
                    return (
                      <button
                        key={yearOption}
                        type="button"
                        onClick={() => handleYearChange(yearOption)}
                        className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {yearOption}
                      </button>
                    );
                  })}
                </div>
                {shouldShowError('currentYear') && (
                  <p
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.currentYear}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="currentSemester"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  Current Semester <span className="text-red-600">*</span>
                </label>
                <select
                  id="currentSemester"
                  value={formInput.currentSemester}
                  onChange={(e) => {
                    updateField('currentSemester', e.target.value as AcademicSemester | '');
                    markFieldTouched('currentSemester');
                  }}
                  onBlur={() => markFieldTouched('currentSemester')}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 ${
                    shouldShowError('currentSemester')
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                >
                  <option value="">Select semester (1 to 8)</option>
                  {SEMESTER_OPTIONS.map((sem) => {
                    const isRecommended = expectedSemesters.includes(sem);
                    return (
                      <option key={sem} value={sem}>
                        {sem} {isRecommended ? `(Matches ${formInput.currentYear})` : ''}
                      </option>
                    );
                  })}
                </select>
                {formInput.currentYear && !shouldShowError('currentSemester') && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Recommended for {formInput.currentYear}: {expectedSemesters.join(' or ')}
                  </p>
                )}
                {shouldShowError('currentSemester') && (
                  <p
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.currentSemester}</span>
                  </p>
                )}
              </div>
            </div>

            {/* 5. Current Academic Subjects */}
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <label
                  htmlFor="subjectsText"
                  className="block text-sm font-semibold text-slate-900"
                >
                  Current Academic Subjects <span className="text-red-600">*</span>
                </label>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {parsedCurrentSubjects.length} subject
                  {parsedCurrentSubjects.length === 1 ? '' : 's'} added
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2.5">
                Enter the college subjects you are studying this semester, separated by commas.
              </p>

              <textarea
                id="subjectsText"
                rows={2}
                value={formInput.subjectsText}
                onChange={(e) => updateField('subjectsText', e.target.value)}
                onBlur={() => markFieldTouched('currentSubjects')}
                placeholder="e.g., Data Structures & Algorithms, Operating Systems, Database Management Systems"
                className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  shouldShowError('currentSubjects')
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                }`}
              />

              {activeBranchSuggestions && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2">
                    Quick-add common{' '}
                    <span className="font-semibold text-slate-700">{formInput.branch}</span>{' '}
                    subjects (click to toggle):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeBranchSuggestions.subjects.map((subject) => {
                      const isAdded = parsedCurrentSubjects.some(
                        (item) => item.toLowerCase() === subject.toLowerCase()
                      );
                      return (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => handleToggleSubjectSuggestion(subject)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            isAdded
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isAdded ? `✓ ${subject}` : `+ ${subject}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {shouldShowError('currentSubjects') && (
                <p
                  role="alert"
                  className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.currentSubjects}</span>
                </p>
              )}
            </div>

            {/* 6. Career Goal */}
            <div>
              <label
                htmlFor="careerGoal"
                className="block text-sm font-semibold text-slate-900 mb-1"
              >
                Career Goal or Preferred Engineering Field <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-2.5">
                What role, industry, or technical specialization are you aiming for after BTech?
              </p>
              <input
                id="careerGoal"
                type="text"
                value={formInput.careerGoal}
                onChange={(e) => updateField('careerGoal', e.target.value)}
                onBlur={() => markFieldTouched('careerGoal')}
                placeholder="e.g., Full-Stack Software Engineer, Embedded Systems Architect, Structural Design Engineer"
                className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  shouldShowError('careerGoal')
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                }`}
              />

              {activeBranchSuggestions && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">Suggestions:</span>
                  {activeBranchSuggestions.careerGoals.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => {
                        updateField('careerGoal', goal);
                        markFieldTouched('careerGoal');
                      }}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        formInput.careerGoal === goal
                          ? 'bg-blue-50 text-blue-800 border-blue-300 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              )}

              {shouldShowError('careerGoal') && (
                <p
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.careerGoal}</span>
                </p>
              )}
            </div>

            {/* 7. Skills Already Known */}
            <div>
              <label
                htmlFor="knownSkillsText"
                className="block text-sm font-semibold text-slate-900 mb-1"
              >
                Skills Already Known{' '}
                <span className="text-xs font-normal text-slate-500">
                  (Optional for beginners)
                </span>
              </label>
              <p className="text-xs text-slate-500 mb-2.5">
                List any programming languages, CAD/simulation software, lab tools, or frameworks
                you already know. Leave blank if you are starting fresh.
              </p>
              <input
                id="knownSkillsText"
                type="text"
                value={formInput.knownSkillsText}
                onChange={(e) => updateField('knownSkillsText', e.target.value)}
                placeholder="e.g., Python, C, AutoCAD, MATLAB, Git, Basic HTML/CSS (or leave empty)"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* 8 & 9. Weekly Study Hours and Preferred Learning Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="weeklyStudyHours"
                  className="block text-sm font-semibold text-slate-900 mb-1"
                >
                  Available Study Hours / Week <span className="text-red-600">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2.5">
                  Hours outside college lectures for skills & projects (1–60 hrs).
                </p>
                <input
                  id="weeklyStudyHours"
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  value={formInput.weeklyStudyHours}
                  onChange={(e) => updateField('weeklyStudyHours', e.target.value)}
                  onBlur={() => markFieldTouched('weeklyStudyHours')}
                  placeholder="e.g., 10"
                  className={`w-full px-4 py-2.5 text-sm font-mono tabular-nums rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    shouldShowError('weeklyStudyHours')
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                />
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">Quick pick:</span>
                  {['6', '10', '15', '20'].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => {
                        updateField('weeklyStudyHours', hrs);
                        markFieldTouched('weeklyStudyHours');
                      }}
                      className={`px-2 py-0.5 text-xs font-mono tabular-nums rounded border cursor-pointer ${
                        formInput.weeklyStudyHours === hrs
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {hrs}h/wk
                    </button>
                  ))}
                </div>
                {shouldShowError('weeklyStudyHours') && (
                  <p
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.weeklyStudyHours}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="preferredLearningMethod"
                  className="block text-sm font-semibold text-slate-900 mb-1"
                >
                  Preferred Learning Method <span className="text-red-600">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2.5">
                  How do you grasp technical engineering concepts best?
                </p>
                <select
                  id="preferredLearningMethod"
                  value={formInput.preferredLearningMethod}
                  onChange={(e) => {
                    updateField('preferredLearningMethod', e.target.value as LearningMethod | '');
                    markFieldTouched('preferredLearningMethod');
                  }}
                  onBlur={() => markFieldTouched('preferredLearningMethod')}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 ${
                    shouldShowError('preferredLearningMethod')
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                  }`}
                >
                  <option value="">Select learning style</option>
                  {LEARNING_METHOD_OPTIONS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                {shouldShowError('preferredLearningMethod') && (
                  <p
                    role="alert"
                    className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.preferredLearningMethod}</span>
                  </p>
                )}
              </div>
            </div>

            {hasSubmittedOnce && !isValid && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1"
              >
                <p className="font-bold">
                  Please resolve the highlighted fields before saving:
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  {Object.values(errors).map((errMsg, idx) => (
                    <li key={idx}>{errMsg}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit & Cancel Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                {mode === 'edit'
                  ? 'Changes are only saved when you click "Save Changes" below.'
                  : 'Existing saved data is never overwritten if you cancel.'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-700 rounded-xl hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
                >
                  {isSaving
                    ? 'Saving...'
                    : mode === 'edit'
                    ? 'Save Changes'
                    : 'Save Profile & Build My Roadmap'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Confirmation Dialog before replacing an already-saved profile/roadmap during re-onboarding */}
        {confirmOverwriteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <h2 className="text-base font-bold text-slate-900">
                Confirm New Onboarding Profile
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You already have a saved student profile ({initialProfile?.fullName}). How would
                you like to save this new onboarding submission?
              </p>
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = confirmOverwriteModal;
                    setConfirmOverwriteModal(null);
                    onSaveProfile(target, true);
                  }}
                  className="w-full px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 rounded-xl hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  Replace Current Profile & Generate Roadmap for {confirmOverwriteModal.currentSemester}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOverwriteModal(null)}
                  className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel (Keep Existing Saved Data)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
