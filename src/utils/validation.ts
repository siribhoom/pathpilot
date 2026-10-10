/**
 * ============================================================================
 * FILE: src/utils/validation.ts
 * PURPOSE: Contains pure validation functions and string-parsing helpers for
 *          the Student Onboarding Form.
 *
 * WHY THIS FILE EXISTS (Beginner Concept — Separation of Concerns):
 * Keeping validation logic in its own utility file instead of mixing it inside
 * a big UI component makes the rules easy to read, test, and reuse.
 *
 * WHAT VALIDATION PROTECTS AGAINST:
 * 1. Empty required inputs (e.g., submitting spaces `"   "` as a name).
 * 2. Impossible numeric values (e.g., `-5` study hours or `200` hours/week).
 * 3. Missing academic subjects, which are required for PathPilot to connect
 *    classroom learning with real-world applications.
 * ============================================================================
 */

import {
  AcademicSemester,
  AcademicYear,
  EngineeringBranch,
  LearningMethod,
  ValidationErrors,
} from '../types/student';

/**
 * RawOnboardingFormInput represents the raw string values directly bound to
 * HTML form inputs before they are converted into a validated StudentProfile.
 */
export interface RawOnboardingFormInput {
  fullName: string;
  branch: EngineeringBranch | '';
  customBranchName: string;
  currentYear: AcademicYear | '';
  currentSemester: AcademicSemester | '';
  subjectsText: string; // Comma-separated or newline-separated string entered by user
  careerGoal: string;
  knownSkillsText: string; // Comma-separated string (optional field!)
  weeklyStudyHours: string; // Kept as string while typing so user can clear input
  preferredLearningMethod: LearningMethod | '';
}

/**
 * Helper Function: parseCommaSeparatedList
 *
 * WHY IT IS NEEDED:
 * When a student types subjects like `"Data Structures, Operating Systems,  , DBMS "`
 * we need to split the string by commas, trim extra spaces around each item,
 * remove empty entries, and eliminate accidental duplicates.
 */
export function parseCommaSeparatedList(rawText: string): string[] {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  const splitItems = rawText
    .split(/[,;\n]+/) // Split on commas, semicolons, or newlines
    .map((item) => item.trim()) // Remove leading/trailing whitespace
    .filter((item) => item.length > 0); // Ignore empty fragments

  // Use a Set to remove case-insensitive duplicates while preserving original casing
  const seenLower = new Set<string>();
  const uniqueItems: string[] = [];

  for (const item of splitItems) {
    const lowerKey = item.toLowerCase();
    if (!seenLower.has(lowerKey)) {
      seenLower.add(lowerKey);
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
}

/**
 * Helper Function: getExpectedSemestersForYear
 *
 * WHY IT IS NEEDED:
 * In a 4-year BTech program, 1st Year corresponds to Semesters 1 & 2,
 * 2nd Year to Semesters 3 & 4, 3rd Year to Semesters 5 & 6, and 4th Year
 * to Semesters 7 & 8. We use this helper to guide the student and catch
 * accidental mismatches (e.g., selecting "1st Year" with "Semester 7").
 */
export function getExpectedSemestersForYear(year: AcademicYear | ''): AcademicSemester[] {
  switch (year) {
    case '1st Year':
      return ['Semester 1', 'Semester 2'];
    case '2nd Year':
      return ['Semester 3', 'Semester 4'];
    case '3rd Year':
      return ['Semester 5', 'Semester 6'];
    case '4th Year':
      return ['Semester 7', 'Semester 8'];
    default:
      return [];
  }
}

/**
 * Main Validation Function: validateOnboardingForm
 *
 * HOW IT WORKS:
 * Takes the current form state (`input`), checks each rule step by step,
 * and returns an object containing:
 * - `errors`: A dictionary of field-specific error messages.
 * - `isValid`: `true` ONLY when `Object.keys(errors).length === 0`.
 */
export function validateOnboardingForm(input: RawOnboardingFormInput): {
  errors: ValidationErrors;
  isValid: boolean;
} {
  const errors: ValidationErrors = {};

  // 1. Validate Full Name
  const trimmedName = input.fullName.trim();
  if (!trimmedName) {
    errors.fullName = 'Please enter your full name so we can personalize your roadmap.';
  } else if (trimmedName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters long.';
  } else if (trimmedName.length > 80) {
    errors.fullName = 'Full name must be under 80 characters.';
  }

  // 2. Validate BTech Branch
  if (!input.branch) {
    errors.branch = 'Please select your BTech engineering branch.';
  } else if (input.branch === 'Other' && input.customBranchName.trim().length < 2) {
    errors.customBranchName = 'Please specify your engineering branch name (e.g., Chemical, Aerospace).';
  }

  // 3. Validate Current Year
  if (!input.currentYear) {
    errors.currentYear = 'Please select your current BTech year (1st to 4th).';
  }

  // 4. Validate Current Semester (and check alignment with selected Year)
  if (!input.currentSemester) {
    errors.currentSemester = 'Please select your current semester.';
  } else if (input.currentYear) {
    const validSemesters = getExpectedSemestersForYear(input.currentYear);
    if (validSemesters.length > 0 && !validSemesters.includes(input.currentSemester)) {
      errors.currentSemester = `${input.currentYear} typically corresponds to ${validSemesters.join(
        ' or '
      )}. Please select a matching semester.`;
    }
  }

  // 5. Validate Current Academic Subjects (at least 1 valid subject required)
  const parsedSubjects = parseCommaSeparatedList(input.subjectsText);
  if (parsedSubjects.length === 0) {
    errors.currentSubjects =
      'Please enter at least one college subject you are studying this semester (separate multiple subjects with commas).';
  } else if (parsedSubjects.some((subject) => subject.length < 2)) {
    errors.currentSubjects =
      'Each subject name should be at least 2 characters long (e.g., "OS", "Data Structures").';
  }

  // 6. Validate Career Goal or Preferred Field
  const trimmedGoal = input.careerGoal.trim();
  if (!trimmedGoal) {
    errors.careerGoal =
      'Please enter your target career goal or preferred engineering field (e.g., "Full-Stack Developer", "VLSI Engineer").';
  } else if (trimmedGoal.length < 3) {
    errors.careerGoal = 'Career goal should be at least 3 characters long.';
  }

  // 7. Validate Available Study Hours Per Week
  // Note: We convert the string input into a Number and check for NaN (Not-a-Number)
  // and realistic weekly bounds (1 to 60 hours outside college classes).
  const rawHours = input.weeklyStudyHours.trim();
  if (!rawHours) {
    errors.weeklyStudyHours = 'Please enter how many hours per week you can dedicate to skill building.';
  } else {
    const numericHours = Number(rawHours);
    if (Number.isNaN(numericHours) || !Number.isFinite(numericHours)) {
      errors.weeklyStudyHours = 'Study hours must be a valid number.';
    } else if (numericHours < 1) {
      errors.weeklyStudyHours = 'Please allocate at least 1 hour per week to build your roadmap.';
    } else if (numericHours > 60) {
      errors.weeklyStudyHours =
        'Alongside BTech classes, please enter a realistic weekly budget (between 1 and 60 hours).';
    }
  }

  // 8. Validate Preferred Learning Method
  if (!input.preferredLearningMethod) {
    errors.preferredLearningMethod = 'Please choose your preferred learning method.';
  }

  // Note on "Skills Already Known":
  // A 1st-year BTech student might genuinely know zero technical skills yet.
  // Therefore, leaving `knownSkillsText` empty is valid and gracefully handled!

  const isValid = Object.keys(errors).length === 0;

  return { errors, isValid };
}
